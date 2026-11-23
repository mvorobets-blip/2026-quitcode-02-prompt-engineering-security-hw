import { describe, expect, it } from "vitest";
import { estimateTotalCents, formatMoney, splitInstallments } from "./quote.js";

// Базові (happy path) тести. Навмисно неповні — розширення покриття
// це і є ваш перший промпт з cookbook (Task A).

describe("estimateTotalCents", () => {
  it("рахує суму без знижки", () => {
    expect(estimateTotalCents({ hours: 10, rateCents: 5000 })).toBe(50000);
  });

  it("застосовує знижку", () => {
    expect(estimateTotalCents({ hours: 10, rateCents: 5000, discountPercent: 10 })).toBe(45000);
  });

  it("hours=0 дає нульову суму", () => {
    expect(estimateTotalCents({ hours: 0, rateCents: 5000, discountPercent: 10 })).toBe(0);
  });

  it("discountPercent=0 дорівнює сумі без знижки", () => {
    expect(estimateTotalCents({ hours: 10, rateCents: 5000, discountPercent: 0 })).toBe(50000);
  });

  it("discountPercent=100 обнуляє суму", () => {
    expect(estimateTotalCents({ hours: 10, rateCents: 5000, discountPercent: 100 })).toBe(0);
  });

  it("округлює дробовий проміжний результат", () => {
    // gross = 3 * 333 = 999; discount = 999 * 10 / 100 = 99.9 -> 899.1 -> round to 899
    expect(estimateTotalCents({ hours: 3, rateCents: 333, discountPercent: 10 })).toBe(899);
  });

  it("коректно округлює рівно .5 центів при дробових годинах (float precision)", () => {
    // hours=0.145 * rateCents=100 = 14.5 центів рівно (математично).
    // 0.145 * 100 у double дає 14.499999999999998, тож наївний Math.round
    // округлює вниз до 14, хоча за контрактом ".5 округлюється у бік більшого" -> 15.
    expect(estimateTotalCents({ hours: 0.145, rateCents: 100 })).toBe(15);
  });

  it("коректно округлює рівно .5 центів для від'ємної суми (Math.round(-14.5) === -14)", () => {
    // hours=-0.5 * rateCents=29 = -14.5 центів рівно, без похибки float.
    // Знакозалежний epsilon (виправлений після рев'ю) міг зсунути це до -15,
    // хоча Math.round(-14.5) документовано округлює до -14.
    expect(estimateTotalCents({ hours: -0.5, rateCents: 29 })).toBe(-14);
  });

  it("рівно .5 на великій сумі округлюється догори (рев'ю 23.11)", () => {
    // 1024.1 × 20485 = 20978688.5 рівно; у double — 20978688.499999996, епсилон 1e-9 замалий.
    expect(estimateTotalCents({ hours: 1024.1, rateCents: 20485 })).toBe(20978689);
  });

  it("значення трохи нижче від'ємної межі .5 не переноситься через неї (рев'ю 23.11)", () => {
    // -0.50000000001 × 29 = -14.50000000029 → найближче ціле -15; зсув +1e-9 давав -14.
    expect(estimateTotalCents({ hours: -0.50000000001, rateCents: 29 })).toBe(-15);
  });

  it("рівно .5 зі знижкою рахується від точного значення", () => {
    // 1 × 29 × (1 − 50/100) = 14.5 → 15
    expect(estimateTotalCents({ hours: 1, rateCents: 29, discountPercent: 50 })).toBe(15);
  });

  it("результат — ціле число без -0", () => {
    expect(Object.is(estimateTotalCents({ hours: -0.01, rateCents: 29 }), 0)).toBe(true);
  });
});

describe("splitInstallments", () => {
  it("ділить суму, що ділиться націло", () => {
    expect(splitInstallments(90000, 3)).toEqual([30000, 30000, 30000]);
  });

  it("сума платежів дорівнює загальній сумі, навіть якщо вона не ділиться націло", () => {
    const parts = splitInstallments(100, 3);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("коректно розподіляє від'ємну суму (наприклад, повернення коштів)", () => {
    const parts = splitInstallments(-100, 3);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(-100);
    expect(parts).toEqual([-33, -33, -34]);
  });

  it("коректно розподіляє, коли платежів більше, ніж центів (межовий випадок)", () => {
    const parts = splitInstallments(2, 5);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(2);
    expect(parts).toEqual([1, 1, 0, 0, 0]);
  });

  it("відхиляє нецілу суму центів замість створювати гроші (рев'ю 23.11)", () => {
    // раніше splitInstallments(100.5, 3) → [34, 34, 33], сума 101
    expect(() => splitInstallments(100.5, 3)).toThrow(RangeError);
  });

  it("відхиляє parts, що не є додатним цілим (рев'ю 23.11)", () => {
    // раніше splitInstallments(100, 0) → [] — 100 центів мовчки зникали
    expect(() => splitInstallments(100, 0)).toThrow(RangeError);
    expect(() => splitInstallments(100, -1)).toThrow(RangeError);
    expect(() => splitInstallments(100, 2.5)).toThrow(RangeError);
  });
});

describe("formatMoney", () => {
  it("форматує центи", () => {
    expect(formatMoney(123450)).toBe("$1,234.50");
  });

  it("форматує від'ємне значення", () => {
    expect(formatMoney(-1234)).toBe("-$12.34");
  });

  it("форматує нуль", () => {
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("доповнює нулем однозначну дробову частину", () => {
    expect(formatMoney(5)).toBe("$0.05");
  });
});
