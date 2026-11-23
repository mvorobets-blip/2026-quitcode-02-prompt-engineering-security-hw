#!/usr/bin/env node
// Крок 0 для prompts/security-scan.md — локальний пошук 🔴-даних БЕЗ моделі.
//
//   node prompts/tools/red-scan.mjs <файл> [--mask <вихідний файл>]
//
// Друкує лише `файл:рядок  ПАТЕРН` — без самих значень, тож вивід можна показати моделі
// чи людині. З `--mask` пише копію документа, де кожен збіг замінено на `<RED:ПАТЕРН>`;
// у модель іде лише ця копія. Код виходу: 0 — 🔴 не знайдено, 1 — знайдено, 2 — помилка.
// Патерни — з docs/sanitization-checklist.md, розділ 3. Це сито, а не гарантія: чого
// тут немає (ПІБ без контактів, адреси), шукає людина за чек-лістом.
import { readFileSync, writeFileSync } from "node:fs";

const PATTERNS = [
  // пароль із самих •, *, x — це вже замаскований приклад (`postgres://user:••••@host`), не секрет
  ["CONNECTION_STRING", /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^\s:@/`'"]+:(?![•*xX]+@)[^\s@`'"]+@[^\s`'"]+/gi],
  ["SLACK_TOKEN", /\bxox[abpors]-[A-Za-z0-9-]{8,}/g],
  ["API_KEY_SK", /\bsk-[A-Za-z0-9_-]{8,}/g],
  ["GITHUB_TOKEN", /\b(?:ghp_|gho_|github_pat_)[A-Za-z0-9_]{16,}/g],
  ["AIRTABLE_PAT", /\bpat[A-Za-z0-9]{3,}\.[A-Za-z0-9]{8,}/g],
  // значення в таблиці/присвоєнні поруч зі словом key/token/secret/password; плейсхолдер <…> не рахується
  ["SECRET_VALUE", /\b(?:api[ _-]?key|key|token|secret|password|passwd)\b[^|\n]{0,40}?(?:[:=]|\|)\s*`?(?!<)[A-Za-z0-9_\-.+/=]{8,}`?/gi],
  ["URL_WITH_CREDENTIALS", /\bhttps?:\/\/[^\s:@/`'"]+:(?![•*xX]+@)[^\s@`'"]+@[^\s`'"]+/gi],
  // адреса на голому документаційному домені (contact1@example.test, RFC 2606) — плейсхолдер;
  // піддомен (oksana@svitanok.example.test) імітує справжню компанію й рахується
  ["EMAIL", /[A-Za-z0-9._%+-]+@(?!example\.(?:com|org|net|test)\b(?!\.))[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g],
  ["PHONE", /\+\d{1,3}[\s-]?\(?\d{2,3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/g],
  ["MESSENGER_HANDLE", /(?<![\w.])@[A-Za-z][A-Za-z0-9_]{4,}\b/g],
];

const args = process.argv.slice(2);
const file = args[0];
const maskIdx = args.indexOf("--mask");
const maskOut = maskIdx >= 0 ? args[maskIdx + 1] : undefined;
if (!file || (maskIdx >= 0 && !maskOut)) {
  process.stderr.write("usage: node prompts/tools/red-scan.mjs <file> [--mask <out>]\n");
  process.exit(2);
}

let text;
try {
  text = readFileSync(file, "utf8");
} catch (e) {
  process.stderr.write(`red-scan: не вдалося прочитати ${file}: ${e.code ?? e.message}\n`);
  process.exit(2);
}

const findings = [];
const masked = text.split("\n").map((line, i) => {
  let out = line;
  for (const [name, re] of PATTERNS) {
    out = out.replace(re, () => {
      findings.push(`${file}:${i + 1}  ${name}`);
      return `<RED:${name}>`;
    });
  }
  return out;
});

if (maskOut) writeFileSync(maskOut, masked.join("\n"));
process.stdout.write(findings.length ? findings.join("\n") + "\n" : `${file}: 🔴 не знайдено\n`);
process.stdout.write(`TOTAL_RED: ${findings.length}\n`);
process.exit(findings.length ? 1 : 0);
