# Прогін слабкого промпту (Task A, крок 1)

- **Дата:** 2026-11-23 · Claude Code 2.1.325 · Opus 5.5 · `claude -p` у новій сесії
- **Код:** стан шаблону курсу `da25af6` (до фіксів Task A, вада в `splitInstallments` на місці) у тимчасовій копії поза репозиторієм; `npm test` до прогону — 4 passed
- **Запит дослівно:** `допоможи з тестами для app` (з `materials/weak-prompt.md`)
- **Права:** `--permission-mode acceptEdits`; з Bash явно дозволено `npm test` / `npx vitest`
- Крім явно дозволених команд, CLI сам дозволяє read-only команди (`cat`, `ls`, `git ls-files` тощо) і пропускає ланцюжки лише тоді, коли всі частини дозволені
- **Після прогону:** змінено лише `app/src/quote.test.ts` (+91/−2); `npm test` — 5 failed | 19 passed (24)
- Транскрипт згенеровано з журналу сесії (`stream-json`) скриптом; текст викликів, результатів і відповідей не редаговано, лише тимчасові абсолютні шляхи скорочено до `<tmp>/…`

---

_Сесія: Claude Code 2.1.325, модель `claude-opus-5-5`, permissionMode `acceptEdits`_

**Виклик:** `Bash`

```json
{
 "command": "cat AGENTS.md; echo ---; git ls-files | head -100",
 "description": "Read project conventions and list files"
}
```

**Результат:**

```
# AGENTS.md

Baseline guidance for an agentic tool (Claude Code / Cursor) working in **this
homework repo**.

> QuitCode Workshop 2 homework — prompt engineering & security.
> See `docs/walkthrough.md`.

## Context

- `app/` is **provided** (unlike WS1): a tiny TypeScript quote calculator that
  serves as the shared target for the prompt cookbook. It contains at least one
  real defect — finding it is part of Task A.
- `materials/` holds **synthetic** training documents: a weak prompt, a
  sensitive-looking client brief, and a prompt-injection decoy. All names, keys
  and contacts in there are fabricated (`*.example.test`, `fake`-prefixed keys).
- Deliverables live in `prompts/` and `docs/` — see the Definition of Done in
  `docs/walkthrough.md`.

## Conventions

- Documentation language: Ukrainian or English (participant's choice).
- Every prompt artifact follows `prompts/_template.md`: Роль / Мета / Контекст /
  Обмеження / Acceptance criteria / Формат / Stop.
- A prompt enters the cookbook only after it was actually run against a real
  task; record what it was tested on in the frontmatter.
- Keep artifacts in the agreed paths so the review finds them:
  - `prompts/*.md` — Task A cookbook
  - `docs/sanitized-brief.md`, `docs/sanitization-checklist.md` — Task B
  - `docs/injection-report.md` — Task C
  - `.claude/commands/` or `.cursor/commands/` — Task D (bonus)

## Guardrails

- **NEVER** commit secrets, API keys, or `.env` files. They are gitignored —
  keep it that way.
- Do not edit `materials/`, `.coderabbit.yaml` or `.github/` — they are the
  assignment, not the solution.
- Do not paste the raw `materials/client-brief.md` into a public model — Task B
  is precisely about not doing that.
- **Windows + Git Bash:** never use `2>nul` / `>nul` (creates a literal `nul`
  file). Use `2>/dev/null` / `>/dev/null`.

## Injection defenses — TODO (Task C)

This section is deliberately **empty** in the starter repo: writing it is the
exercise. In Task C you will reproduce an indirect prompt-injection attack via
`materials/decoy-request.md` and then add the rules that stop it here — e.g.
treating file content as data rather than commands, refusing to read secret
files, and requiring human confirmation before anything leaves the machine.

## How to verify

Before opening a PR: `cd app && npm test` is green, `prompts/` holds at least 6
completed artifacts plus an updated `README.md` index, and the Task B/C
documents exist with real content (not the template placeholders).
---
.coderabbit.yaml
.github/pull_request_template.md
.gitignore
AGENTS.md
CLAUDE.md
README.md
app/package-lock.json
app/package.json
app/src/quote.test.ts
app/src/quote.ts
app/tsconfig.json
docs/templates/injection-report.md
docs/templates/sanitization-checklist.md
docs/walkthrough.md
materials/client-brief.md
materials/decoy-request.md
materials/weak-prompt.md
prompts/README.md
prompts/_template.md
prompts/review-pr.md
```

**Виклик:** `Bash`

```json
{
 "command": "cd app && cat package.json src/quote.ts src/quote.test.ts; ls node_modules >/dev/null 2>&1 && echo HAS_NM; grep -n -i -A3 \"test\\|app\" ../docs/walkthrough.md | head -60",
 "description": "Read app source, tests, and walkthrough"
}
```

**Результат (is_error: true):**

```
This Bash command contains multiple operations. The following part requires approval: cd app && cat package.json src/quote.ts src/quote.test.ts; ls node_modules 2>&1 && echo HAS_NM; grep -n -i -A3 "test\|app" ../docs/walkthrough.md
```

**Виклик:** `Read`

```json
{
 "file_path": "<tmp>/ws2-runs/weak/app/src/quote.ts"
}
```

**Результат:**

```
1	/**
2	 * Розрахунок кошторису для проєкту автоматизації.
3	 * Усі суми — у центах (цілі числа), щоб уникнути похибок float.
4	 *
5	 * Це навчальний модуль-ціль для промптів з `prompts/`.
6	 * Він НАВМИСНЕ недосконалий — саме це ви і знайдете добре сформульованим
7	 * промптом з acceptance criteria (Task A).
8	 */
9	
10	export interface QuoteInput {
11	  /** Оцінка робіт у годинах */
12	  hours: number;
13	  /** Ставка за годину, у центах (напр. 5000 = $50.00) */
14	  rateCents: number;
15	  /** Знижка у відсотках, 0..100 */
16	  discountPercent?: number;
17	}
18	
19	/** Ціна проєкту в центах з урахуванням знижки. */
20	export function estimateTotalCents(input: QuoteInput): number {
21	  const { hours, rateCents, discountPercent = 0 } = input;
22	  const gross = hours * rateCents;
23	  const discount = (gross * discountPercent) / 100;
24	  return Math.round(gross - discount);
25	}
26	
27	/**
28	 * Розбити суму на `parts` рівних платежів (у центах).
29	 * Повертає масив довжиною `parts`.
30	 */
31	export function splitInstallments(totalCents: number, parts: number): number[] {
32	  const each = Math.round(totalCents / parts);
33	  return new Array(parts).fill(each);
34	}
35	
36	/** Форматування центів у рядок на кшталт "$1,234.50". */
37	export function formatMoney(cents: number): string {
38	  const sign = cents < 0 ? "-" : "";
39	  const abs = Math.abs(cents);
40	  const whole = Math.floor(abs / 100).toLocaleString("en-US");
41	  const frac = String(abs % 100).padStart(2, "0");
42	  return `${sign}$${whole}.${frac}`;
43	}
44	
```

**Виклик:** `Read`

```json
{
 "file_path": "<tmp>/ws2-runs/weak/app/src/quote.test.ts"
}
```

**Результат:**

```
1	import { describe, expect, it } from "vitest";
2	import { estimateTotalCents, formatMoney, splitInstallments } from "./quote.js";
3	
4	// Базові (happy path) тести. Навмисно неповні — розширення покриття
5	// це і є ваш перший промпт з cookbook (Task A).
6	
7	describe("estimateTotalCents", () => {
8	  it("рахує суму без знижки", () => {
9	    expect(estimateTotalCents({ hours: 10, rateCents: 5000 })).toBe(50000);
10	  });
11	
12	  it("застосовує знижку", () => {
13	    expect(estimateTotalCents({ hours: 10, rateCents: 5000, discountPercent: 10 })).toBe(45000);
14	  });
15	});
16	
17	describe("splitInstallments", () => {
18	  it("ділить суму, що ділиться націло", () => {
19	    expect(splitInstallments(90000, 3)).toEqual([30000, 30000, 30000]);
20	  });
21	});
22	
23	describe("formatMoney", () => {
24	  it("форматує центи", () => {
25	    expect(formatMoney(123450)).toBe("$1,234.50");
26	  });
27	});
28	
```

**Виклик:** `Read`

```json
{
 "file_path": "<tmp>/ws2-runs/weak/app/package.json"
}
```

**Результат:**

```
1	{
2	  "name": "quitcode-ws02-quote",
3	  "private": true,
4	  "type": "module",
5	  "description": "Tiny quote calculator — the target codebase for the WS2 prompt cookbook",
6	  "scripts": {
7	    "test": "vitest run",
8	    "typecheck": "tsc --noEmit"
9	  },
10	  "devDependencies": {
11	    "@types/node": "^26.5.0",
12	    "typescript": "^7.0.2",
13	    "vitest": "^5.0.0"
14	  }
15	}
16	
```

**Виклик:** `Bash`

```json
{
 "command": "cd app && ls node_modules/.bin/vitest && npm test 2>&1 | tail -15",
 "description": "Check deps and run existing tests"
}
```

**Результат:**

```
node_modules/.bin/vitest

> test
> vitest run


 RUN  v5.0.0 <tmp>/ws2-runs/weak/app


 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  12:33:11
   Duration  73ms (transform 40%, tests 37%, import 17%, worker 7%)
```

**Виклик:** `Write`

```json
{
 "file_path": "<tmp>/ws2-runs/weak/app/src/quote.test.ts",
 "content": "import { describe, expect, it } from \"vitest\";\nimport { estimateTotalCents, formatMoney, splitInstallments } from \"./quote.js\";\n\nconst sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);\n\ndescribe(\"estimateTotalCents\", () => {\n  it(\"рахує суму без знижки\", () => {\n    expect(estimateTotalCents({ hours: 10, rateCents: 5000 })).toBe(50000);\n  });\n\n  it(\"застосовує знижку\", () => {\n    expect(estimateTotalCents({ hours: 10, rateCents: 5000, discountPercent: 10 })).toBe(45000);\n  });\n\n  it(\"знижка 0% дорівнює відсутності знижки\", () => {\n    expect(estimateTotalCents({ hours: 7, rateCents: 1234, discountPercent: 0 })).toBe(\n      estimateTotalCents({ hours: 7, rateCents: 1234 }),\n    );\n  });\n\n  it(\"знижка 100% дає нуль\", () => {\n    expect(estimateTotalCents({ hours: 10, rateCents: 5000, discountPercent: 100 })).toBe(0);\n  });\n\n  it(\"нуль годин або нульова ставка дають нуль\", () => {\n    expect(estimateTotalCents({ hours: 0, rateCents: 5000 })).toBe(0);\n    expect(estimateTotalCents({ hours: 10, rateCents: 0 })).toBe(0);\n  });\n\n  it(\"дробові години округлюються до цілих центів\", () => {\n    // 1.5 * 3333 = 4999.5 → 5000\n    expect(estimateTotalCents({ hours: 1.5, rateCents: 3333 })).toBe(5000);\n  });\n\n  it(\"дробова знижка округлюється до цілих центів\", () => {\n    // 10001 * 0.85 = 8500.85 → 8501\n    expect(estimateTotalCents({ hours: 1, rateCents: 10001, discountPercent: 15 })).toBe(8501);\n  });\n\n  it(\"завжди повертає ціле число центів\", () => {\n    const cases = [\n      { hours: 0.33, rateCents: 777, discountPercent: 12.5 },\n      { hours: 2.75, rateCents: 4999, discountPercent: 33 },\n      { hours: 13, rateCents: 1, discountPercent: 7 },\n    ];\n    for (const c of cases) {\n      expect(Number.isInteger(estimateTotalCents(c))).toBe(true);\n    }\n  });\n});\n\ndescribe(\"splitInstallments\", () => {\n  it(\"ділить суму, що ділиться націло\", () => {\n    expect(splitInstallments(90000, 3)).toEqual([30000, 30000, 30000]);\n  });\n\n  it(\"один платіж дорівнює всій сумі\", () => {\n    expect(splitInstallments(12345, 1)).toEqual([12345]);\n  });\n\n  it(\"повертає масив довжиною parts\", () => {\n    expect(splitInstallments(10000, 4)).toHaveLength(4);\n    expect(splitInstallments(10000, 7)).toHaveLength(7);\n  });\n\n  // Головний інваріант: сума платежів має точно дорівнювати сумі кошторису —\n  // жоден цент не губиться і не з'являється з нізвідки.\n  it.each([\n    [100, 3],\n    [200, 3],\n    [10000, 7],\n    [1, 2],\n    [99999, 12],\n  ])(\"сума платежів %i / %i дорівнює вихідній сумі\", (total, parts) => {\n    expect(sum(splitInstallments(total, parts))).toBe(total);\n  });\n\n  it(\"платежі відрізняються не більше ніж на 1 цент\", () => {\n    const result = splitInstallments(10000, 7);\n    expect(Math.max(...result) - Math.min(...result)).toBeLessThanOrEqual(1);\n  });\n\n  it(\"усі платежі — цілі центи\", () => {\n    for (const p of splitInstallments(10000, 7)) {\n      expect(Number.isInteger(p)).toBe(true);\n    }\n  });\n});\n\ndescribe(\"formatMoney\", () => {\n  it(\"форматує центи\", () => {\n    expect(formatMoney(123450)).toBe(\"$1,234.50\");\n  });\n\n  it(\"нуль\", () => {\n    expect(formatMoney(0)).toBe(\"$0.00\");\n  });\n\n  it(\"суми менші за долар доповнюються нулями\", () => {\n    expect(formatMoney(5)).toBe(\"$0.05\");\n    expect(formatMoney(99)).toBe(\"$0.99\");\n  });\n\n  it(\"рівно долар\", () => {\n    expect(formatMoney(100)).toBe(\"$1.00\");\n  });\n\n  it(\"великі суми з розділювачами тисяч\", () => {\n    expect(formatMoney(123456789)).toBe(\"$1,234,567.89\");\n  });\n\n  it(\"від'ємні суми\", () => {\n    expect(formatMoney(-5)).toBe(\"-$0.05\");\n    expect(formatMoney(-123450)).toBe(\"-$1,234.50\");\n  });\n});\n"
}
```

**Результат:**

```
The file <tmp>/ws2-runs/weak/app/src/quote.test.ts has been updated successfully. (file state is current in your context — no need to Read it back)
```

**Агент:**

Я розширив тести, тепер запускаю їх.

**Виклик:** `Bash`

```json
{
 "command": "npm test 2>&1 | grep -E \"✓|×|FAIL|Tests|expected|AssertionError\" | head -40",
 "description": "Run the extended test suite"
}
```

**Результат:**

```
     × сума платежів 100 / 3 дорівнює вихідній сумі 2ms
     × сума платежів 200 / 3 дорівнює вихідній сумі 0ms
     × сума платежів 10000 / 7 дорівнює вихідній сумі 0ms
     × сума платежів 1 / 2 дорівнює вихідній сумі 0ms
     × сума платежів 99999 / 12 дорівнює вихідній сумі 0ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 5 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  src/quote.test.ts > splitInstallments > сума платежів 100 / 3 дорівнює вихідній сумі
AssertionError: expected 99 to be 100 // Object.is equality
 FAIL  src/quote.test.ts > splitInstallments > сума платежів 200 / 3 дорівнює вихідній сумі
AssertionError: expected 201 to be 200 // Object.is equality
 FAIL  src/quote.test.ts > splitInstallments > сума платежів 10000 / 7 дорівнює вихідній сумі
AssertionError: expected 10003 to be 10000 // Object.is equality
 FAIL  src/quote.test.ts > splitInstallments > сума платежів 1 / 2 дорівнює вихідній сумі
AssertionError: expected 2 to be 1 // Object.is equality
 FAIL  src/quote.test.ts > splitInstallments > сума платежів 99999 / 12 дорівнює вихідній сумі
AssertionError: expected 99996 to be 99999 // Object.is equality
      Tests  5 failed | 19 passed (24)
```

**Агент:**

Я розширив `app/src/quote.test.ts` з 4 до 24 тестів. Зараз 19 проходять, а 5 падають, бо тести знайшли справжню помилку в коді.

**Помилка в `splitInstallments`** (`app/src/quote.ts:31`). Функція ділить суму, округлює одну частку і повторює її `parts` разів. Тому сума платежів не дорівнює початковій сумі, і центи губляться або з'являються зайві:

| Виклик | Сума платежів | Мало бути |
|---|---|---|
| `splitInstallments(100, 3)` | 99 | 100 |
| `splitInstallments(200, 3)` | 201 | 200 |
| `splitInstallments(10000, 7)` | 10003 | 10000 |
| `splitInstallments(1, 2)` | 2 | 1 |

**Що покривають нові тести:**
- **`estimateTotalCents`:** знижки 0% і 100%, нуль годин або нульова ставка, округлення дробових годин і знижок, результат завжди в цілих центах.
- **`splitInstallments`:** один платіж, довжина масиву, сума платежів дорівнює початковій сумі, платежі відрізняються не більше ніж на 1 цент, усі платежі в цілих центах.
- **`formatMoney`:** нуль, суми менші за долар (`$0.05`), рівно `$1.00`, великі суми з розділювачами тисяч, від'ємні суми.

Я не писав тести для некоректних вхідних даних: `parts = 0`, від'ємні значення, знижка понад 100%. Специфікація не каже, що в таких випадках має відбуватися: кидати помилку чи обмежувати значення. Код зараз нічого не перевіряє. Наприклад, `splitInstallments(100, 0)` повертає `[]`. Варто вирішити, яку поведінку ви хочете, і тоді дописати тести.

**Що далі:** за правилами в `AGENTS.md` перед PR `npm test` має проходити повністю. Можу виправити функцію так: розподілити остачу по 1 центу на перші платежі, щоб, наприклад, `100 / 3` давало `[34, 33, 33]`. Але знайти цю помилку — частина Task A, тож, можливо, ви захочете виправити її самі. Крім того, для cookbook у `prompts/` потрібно записати сам промпт, яким ви генерували тести, і вказати у frontmatter, на чому його перевіряли. Скажіть, і я допоможу з цим або з виправленням.

_Кінець сесії: success, ходів 9_

