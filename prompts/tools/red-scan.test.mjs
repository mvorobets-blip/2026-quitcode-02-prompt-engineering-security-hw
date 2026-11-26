// Тести кроку 0 (red-scan): node --test prompts/tools/red-scan.test.mjs
// Перевіряють, що в копію для моделі не потрапляє жодна частина секрету, а плейсхолдери лишаються.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath, а не .pathname: шлях із пробілом чи кирилицею інакше лишився б percent-encoded.
const script = fileURLToPath(new URL("./red-scan.mjs", import.meta.url));

// Синтетичні значення збираємо з частин під час тесту: у файлі немає рядка, схожого на справжній креденшел,
// тож сканери секретів репозиторію (GitGuardian) його не позначають, а scan() отримує повне значення.
const fake = (...parts) => parts.join("");
const CRM_KEY = fake("demo", "Credential", "12345");
const SERVICE = fake("abcd", "1234", "efgh");
const DB_PASS = fake("Sup3r", "S3cret", "!");
const JWT_LIKE = fake("eyJ", "hbGciOi", "JIUzI1NiJ9", ".abc.def");
const BASIC = Buffer.from(fake("us", "er:", "pass", "word")).toString("base64");
const BEARER = fake("abcdefgh", "ijklmnop", "1234");

function scan(text) {
  const dir = mkdtempSync(join(tmpdir(), "red-scan-"));
  const input = join(dir, "in.md");
  const output = join(dir, "out.md");
  writeFileSync(input, text);
  let code = 0;
  try {
    execFileSync(process.execPath, [script, input, "--mask", output], { stdio: "pipe" });
  } catch (e) {
    code = e.status;
  }
  return { code, masked: readFileSync(output, "utf8") };
}

test("пароль з пробілами маскується повністю, а не лише перше слово (рев'ю 25.11)", () => {
  const { code, masked } = scan("password: correct-horse battery staple");
  assert.equal(code, 1);
  assert.doesNotMatch(masked, /correct|horse|battery|staple/);
});

test("JSON \"password\": \"…\" маскується разом із лапками й пунктуацією (рев'ю 25.11)", () => {
  const { code, masked } = scan('{"password": "Tr0ub4dor&3 x!", "user": "demo"}');
  assert.equal(code, 1);
  assert.doesNotMatch(masked, /Tr0ub4dor|&3|x!/);
  assert.match(masked, /"user": "demo"/);
});

test("рядок таблиці | token | значення | — маскується лише клітинка значення", () => {
  const { masked } = scan("| token | abcd1234efgh5678 | для CI |");
  assert.doesNotMatch(masked, /abcd1234efgh5678/);
  assert.match(masked, /для CI/);
});

test("складені імена змінних: CRM_API_KEY=…, SERVICE_TOKEN: …, db-password=… (повторне рев'ю 25.11)", () => {
  const { code, masked } = scan(`CRM_API_KEY=${CRM_KEY}\nSERVICE_TOKEN: ${SERVICE}\ndb-password=${DB_PASS}`);
  assert.equal(code, 1);
  for (const value of [CRM_KEY, SERVICE, DB_PASS]) assert.ok(!masked.includes(value), value);
});

test("заголовок Authorization: Bearer / Basic і окремий Bearer-токен (повторне рев'ю 25.11)", () => {
  const { code, masked } = scan(
    `Authorization: Bearer ${JWT_LIKE}\nAuthorization: Basic ${BASIC}\ncurl -H "Bearer ${BEARER}"`,
  );
  assert.equal(code, 1);
  for (const value of [JWT_LIKE, BASIC, BEARER]) assert.ok(!masked.includes(value), value);
});

test("заголовок Authorization у JSON-формі: {\"Authorization\":\"Basic …\"} (рев'ю 26.11)", () => {
  const { code, masked } = scan(`{"Authorization":"Basic ${BASIC}"}\n{"authorization": "Token ${SERVICE}"}`);
  assert.equal(code, 1);
  for (const value of [BASIC, SERVICE]) assert.ok(!masked.includes(value), value);
});

test("значення-фраза з Bearer у клітинці пароля маскується повністю (рев'ю 25.11, третій прохід)", () => {
  const tail = fake("tail", "phrase", "9876");
  const { code, masked } = scan(`| password | "Bearer ${BEARER} ${tail}" |`);
  assert.equal(code, 1);
  assert.ok(!masked.includes(BEARER) && !masked.includes(tail), masked);
});

test("слова на кшталт keyboard / tokenizer і плейсхолдер Bearer <TOKEN> не рахуються", () => {
  const { code } = scan("keyboard: mechanical-switches\ntokenizer = whitespace-splitter\nAuthorization: Bearer <TOKEN>");
  assert.equal(code, 0);
});

test("плейсхолдери й уже замасковане не рахуються", () => {
  const { code, masked } = scan("API key: <YOUR_KEY>\npostgres://user:••••@host/db\npassword: ********");
  assert.equal(code, 0);
  assert.match(masked, /<YOUR_KEY>/);
});

test("сирий токен і рядок підключення з паролем ловляться, як і раніше", () => {
  const { code, masked } = scan("ghp_" + "a".repeat(20) + "\npostgres://user:s3cretpass@db.example:5432/app");
  assert.equal(code, 1);
  assert.doesNotMatch(masked, /aaaaaaaa|s3cretpass/);
});
