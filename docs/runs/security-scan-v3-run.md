# Прогін `prompts/security-scan.md` v3 (23.11.2026)

- **Документ:** `materials/client-brief.md` (синтетичний бриф курсу)
- **Крок 0, без моделі:** `node prompts/tools/red-scan.mjs materials/client-brief.md --mask <tmp>/masked.md`, код виходу 1. Вивід дослівно:

```
materials/client-brief.md:17  EMAIL
materials/client-brief.md:18  PHONE
materials/client-brief.md:19  MESSENGER_HANDLE
materials/client-brief.md:37  SECRET_VALUE
materials/client-brief.md:38  SLACK_TOKEN
materials/client-brief.md:39  AIRTABLE_PAT
materials/client-brief.md:41  CONNECTION_STRING
materials/client-brief.md:47  PHONE
materials/client-brief.md:48  PHONE
materials/client-brief.md:49  PHONE
TOTAL_RED: 10
```

- **Крок 1, модель:** Claude Code 2.1.325 · Opus 5.5 · `claude -p` у новій сесії, у тимчасовій теці, де лежать **лише** `masked.md` і `red.txt` (вивід кроку 0); `Bash`, `WebFetch`, `WebSearch` заборонені прапорцем. Промпт — текст `security-scan.md` v3 до розділу «Результат реального запуску», потім одне речення зі шляхами
- **Перевірка після:** у журналі сесії (`stream-json`) немає жодного зі значень, які замаскував крок 0 (пошук за фрагментами токенів, пароля й телефону — 0 збігів)
- **Обмеження, яке показав прогін:** крок 0 не ловить ПІБ і адреси, тож вони дійшли до моделі в `masked.md` (рядки 16, 47–49). Модель позначила їх 🔴 без значень, але за чек-лістом це вже зайве; ПІБ і адреси людина має прибрати до кроку 1
- Транскрипт згенеровано з журналу сесії скриптом; текст не редаговано, лише тимчасові шляхи скорочено до `<tmp>/…`

---

_Сесія: Claude Code 2.1.325, модель `claude-opus-5-5`, permissionMode `default`_

**Виклик:** `Read`

```json
{
 "file_path": "<tmp>/ws2-runs/scan-v3/red.txt"
}
```

**Результат:**

```
1	materials/client-brief.md:17  EMAIL
2	materials/client-brief.md:18  PHONE
3	materials/client-brief.md:19  MESSENGER_HANDLE
4	materials/client-brief.md:37  SECRET_VALUE
5	materials/client-brief.md:38  SLACK_TOKEN
6	materials/client-brief.md:39  AIRTABLE_PAT
7	materials/client-brief.md:41  CONNECTION_STRING
8	materials/client-brief.md:47  PHONE
9	materials/client-brief.md:48  PHONE
10	materials/client-brief.md:49  PHONE
11	TOTAL_RED: 10
12	
```

**Виклик:** `Read`

```json
{
 "file_path": "<tmp>/ws2-runs/scan-v3/masked.md"
}
```

**Результат:**

```
1	<!--
2	============================================================================
3	СИНТЕТИЧНИЙ ДОКУМЕНТ — навчальний матеріал для Task B (санітизація).
4	Усі імена, контакти, ключі та дані ВИГАДАНІ й нічого не відкривають:
5	домени *.example.test не резолвляться, ключі мають префікс "fake".
6	Поводьтеся з ним так, ніби він справжній — у цьому й вправа.
7	============================================================================
8	-->
9	
10	# Бриф на автоматизацію — ТОВ «Світанок Логістика»
11	
12	**Внутрішній документ QuitCode.** Підготував: акаунт-менеджер, 2026-09-03.
13	
14	## Контакт з боку клієнта
15	
16	- Оксана Петренко, Head of Operations
17	- <RED:EMAIL>
18	- <RED:PHONE>
19	- Особистий Telegram для термінових питань: <RED:MESSENGER_HANDLE>
20	
21	## Задача
22	
23	Клієнт вручну обробляє заявки на перевезення: менеджер копіює дані з пошти в
24	Google Sheets, потім створює запис у CRM і повідомляє водія в Slack. Треба
25	автоматизувати: заявка → валідація → запис у CRM → сповіщення водія.
26	Обсяг: ~400 заявок/тиждень, пікові дні — понеділок і четвер.
27	
28	Критерії приймання:
29	- заявка з некоректним телефоном або без адреси доставки не потрапляє в CRM;
30	- сповіщення водію йде не пізніше ніж за 2 хвилини після заявки;
31	- усі відхилені заявки видно в окремому звіті.
32	
33	## Доступи (з нашого n8n, продакшн)
34	
35	| Сервіс | Значення |
36	|---|---|
37	| CRM <RED:SECRET_VALUE> |
38	| Slack Bot Token | `<RED:SLACK_TOKEN>` |
39	| Airtable Base | `appFAKE0base0id00` / PAT `<RED:AIRTABLE_PAT>` |
40	| Webhook (прод) | `https://n8n.quitcode.example.test/webhook/svitanok-intake` |
41	| Postgres (репліка) | `<RED:CONNECTION_STRING>` |
42	
43	## Вигрузка з продакшену (приклад 3 рядків)
44	
45	| # | Замовник | Телефон | Адреса | Сума, ₴ |
46	|---|---|---|---|---|
47	| 1 | Ігор Мельник | <RED:PHONE> | м. Львів, вул. Наукова 7, кв. 12 | 4 850 |
48	| 2 | Наталія Ковальчук | <RED:PHONE> | м. Київ, просп. Перемоги 104 | 12 300 |
49	| 3 | ФОП Бондаренко С.П. | <RED:PHONE> | м. Одеса, вул. Канатна 22, оф. 5 | 7 100 |
50	
51	## Комерційна частина (тільки для внутрішнього використання)
52	
53	- Оцінка: 60 год × $45/год = $2 700 для клієнта.
54	- Наша собівартість: $22/год. Маржа ~51%.
55	- Клієнт паралельно спілкується з конкурентом; наш дедлайн на пропозицію — 12.09.
56	
```

**Агент:**

## Знахідки
🔴 | materials/client-brief.md:17 | EMAIL | `<RED:EMAIL>`
🔴 | materials/client-brief.md:18 | PHONE | `<RED:PHONE>`
🔴 | materials/client-brief.md:19 | MESSENGER_HANDLE | `<RED:MESSENGER_HANDLE>`
🔴 | materials/client-brief.md:37 | SECRET_VALUE | `<RED:SECRET_VALUE>`
🔴 | materials/client-brief.md:38 | SLACK_TOKEN | `<RED:SLACK_TOKEN>`
🔴 | materials/client-brief.md:39 | AIRTABLE_PAT | `<RED:AIRTABLE_PAT>`
🔴 | materials/client-brief.md:41 | CONNECTION_STRING | `<RED:CONNECTION_STRING>`
🔴 | materials/client-brief.md:47 | PHONE | `<RED:PHONE>`
🔴 | materials/client-brief.md:48 | PHONE | `<RED:PHONE>`
🔴 | materials/client-brief.md:49 | PHONE | `<RED:PHONE>`
🔴 (знайшов додатково) | masked.md:16 | PII_NAME: ПІБ контактної особи клієнта разом із посадою | `<RED:PII_NAME>`
🔴 (знайшов додатково) | masked.md:47 | EXPORT_ROW: ПІБ + повна адреса + сума з продакшн-вигрузки | `<RED:EXPORT_ROW>`
🔴 (знайшов додатково) | masked.md:48 | EXPORT_ROW: ПІБ + повна адреса + сума з продакшн-вигрузки | `<RED:EXPORT_ROW>`
🔴 (знайшов додатково) | masked.md:49 | EXPORT_ROW: назва ФОП + повна адреса + сума з продакшн-вигрузки | `<RED:EXPORT_ROW>`
🔴 (знайшов додатково) | masked.md:40 | PROD_WEBHOOK_URL: робочий вебхук продакшну; якщо він без автентифікації, сама URL-адреса діє як секрет | `<RED:PROD_WEBHOOK_URL>`
🟡 | masked.md:10 | назва клієнта | `ТОВ «Світанок Логістика»`
🟡 | masked.md:33 | внутрішній постачальник автоматизації + середовище | `з нашого n8n, продакшн`
🟡 | masked.md:39 | внутрішня система + ідентифікатор бази | `Airtable Base | appFAKE0base0id00`
🟡 | masked.md:40 | внутрішній хост/сервіс | `n8n.quitcode…/webhook/svitanok-intake` (хост n8n і назва сервісу `svitanok-intake`)
🟡 | masked.md:41 | конкретна БД / топологія | `Postgres (репліка)`
🟡 | masked.md:53 | ставка й оцінка з реальними числами | `60 год × $45/год = $2 700`
🟡 | masked.md:54 | собівартість і маржа | `собівартість: $22/год. Маржа ~51%`
🟡 | masked.md:55 | внутрішня комерційна стратегія | `спілкується з конкурентом; наш дедлайн на пропозицію — 12.09`

Документ позначено як синтетичний (`*.example.test`, префікс `fake`). Попри це, я повідомив про кожен збіг. Вирішувати, чи це насправді безпечно, має людина.

Не позначено як 🟡: Google Sheets, CRM і Slack у рядку 24 (`masked.md:24`). Це системи самого клієнта з постановки задачі, тобто 🟢.

## Вердикт
НЕ ВСТАВЛЯТИ: крок 0 знайшов 10 🔴 (токени, connection string, контакти, телефони з вигрузки), а в `masked.md` є ще ПІБ, адреси й суми з продакшн-вигрузки.

_Кінець сесії: success, ходів 3_

