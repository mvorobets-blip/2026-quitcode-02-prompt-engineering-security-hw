# quitcode-ws02-quote

Невеликий модуль для розрахунку кошторису проєкту: обчислення підсумкової
суми з урахуванням знижки, розбиття суми на платежі та форматування центів
у грошовий рядок. Усі суми оперують цілими центами, щоб уникнути похибок
float.

## Приклад використання

```ts
import { estimateTotalCents, splitInstallments, formatMoney } from "./src/quote.js";

// 10 годин по $50.00 зі знижкою 10%
const totalCents = estimateTotalCents({ hours: 10, rateCents: 5000, discountPercent: 10 });
// -> 45000

// розбити суму на 3 платежі
const installments = splitInstallments(totalCents, 3);
// -> [15000, 15000, 15000]

// відформатувати суму для показу користувачу
formatMoney(totalCents);
// -> "$450.00"
```

## Запуск тестів

```
npm test
```
