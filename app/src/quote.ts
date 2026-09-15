/**
 * Розрахунок кошторису для проєкту автоматизації.
 * Усі суми — у центах (цілі числа), щоб уникнути похибок float.
 *
 * Це навчальний модуль-ціль для промптів з `prompts/`.
 */

export interface QuoteInput {
  /** Оцінка робіт у годинах */
  hours: number;
  /** Ставка за годину, у центах (напр. 5000 = $50.00) */
  rateCents: number;
  /** Знижка у відсотках, 0..100 */
  discountPercent?: number;
}

/**
 * Розраховує ціну проєкту в центах з урахуванням знижки.
 *
 * @param input.hours - кількість годин (може бути дробовим, напр. 2.5)
 * @param input.rateCents - ставка за годину, у центах
 * @param input.discountPercent - знижка у відсотках, 0..100 (за замовчуванням 0)
 * @returns підсумкову суму в центах, округлену до найближчого цілого
 *   (`Math.round`, тобто ".5" округлюється у бік більшого).
 *   При discountPercent=0 повертає суму без знижки; при discountPercent=100 — 0.
 */
export function estimateTotalCents(input: QuoteInput): number {
  const { hours, rateCents, discountPercent = 0 } = input;
  const gross = hours * rateCents;
  const discount = (gross * discountPercent) / 100;
  const raw = gross - discount;
  // `hours * rateCents` (and the discount math derived from it) can land a
  // hair below an exact ".5" boundary due to binary floating-point
  // representation (e.g. 0.145 * 100 === 14.499999999999998 instead of 14.5),
  // which made Math.round silently round down instead of up as documented.
  // Nudge by a tiny epsilon (far below one cent) before rounding to correct
  // for that representation error without changing any real rounding case.
  // The nudge must always point toward +Infinity (not away from zero) to
  // match Math.round's own negative-tie behavior — Math.round(-14.5) is
  // -14, so a sign-flipped epsilon would incorrectly push exact negative
  // ties like -0.5*29=-14.5 down to -15.
  return Math.round(raw + 1e-9);
}

/**
 * Розподіляє залишок (у цілих центах) по перших `remainder` елементах масиву
 * базових значень `base`, додаючи по одному центу до кожного з них.
 *
 * @param base - базове значення кожного платежу
 * @param parts - кількість платежів (довжина результуючого масиву)
 * @param remainder - кількість перших платежів, що отримають `base + 1`
 * @returns масив довжиною `parts`, де перші `remainder` елементів дорівнюють
 *   `base + 1`, а решта — `base`
 */
function distributeRemainderAcrossFirstInstallments(
  base: number,
  parts: number,
  remainder: number,
): number[] {
  return new Array(parts).fill(base).map((v, i) => (i < remainder ? v + 1 : v));
}

/**
 * Розбиває суму (у центах) на `parts` платежів.
 *
 * Оскільки `totalCents` не завжди ділиться націло на `parts`, платежі не
 * обов'язково рівні: береться базова частка `base = Math.floor(totalCents / parts)`,
 * а залишок від ділення (в цілих центах) додається по одному центу до перших
 * `remainder` платежів (вони отримують `base + 1`, решта — `base`). Це гарантує,
 * що сума всіх елементів масиву завжди точно дорівнює `totalCents`, без похибок
 * округлення.
 *
 * @param totalCents - сума до розподілу, у центах
 * @param parts - кількість платежів
 * @returns масив довжиною `parts`, сума елементів якого дорівнює `totalCents`
 */
export function splitInstallments(totalCents: number, parts: number): number[] {
  const base = Math.floor(totalCents / parts);
  const remainder = totalCents - base * parts;
  // Distribute the remainder (in whole cents) across the first `remainder`
  // installments so the sum of all parts always equals totalCents exactly.
  return distributeRemainderAcrossFirstInstallments(base, parts, remainder);
}

/**
 * Форматує суму в центах у рядок на кшталт "$1,234.50".
 *
 * @param cents - сума в центах (ціле число); від'ємні значення підтримуються
 *   і форматуються зі знаком "-" перед "$" (напр. -1234 -> "-$12.34")
 * @returns рядок у форматі `$X,XXX.XX` (ціла частина з роздільниками тисяч
 *   за локаллю en-US, дробова частина — завжди 2 цифри)
 */
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100).toLocaleString("en-US");
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}$${whole}.${frac}`;
}
