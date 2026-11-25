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

/** Точне десяткове значення скінченного числа JS як `n / 10^scale` (з його найкоротшого запису). */
function toDecimal(x: number): { n: bigint; scale: number } {
  if (!Number.isFinite(x)) throw new RangeError(`очікується скінченне число, отримано ${x}`);
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/.exec(String(x));
  if (!m) throw new RangeError(`не вдалося розібрати число ${x}`);
  const [, sign, int, frac = "", exp = "0"] = m;
  let digits = int + frac;
  let scale = frac.length - Number(exp);
  if (scale < 0) {
    digits += "0".repeat(-scale);
    scale = 0;
  }
  return { n: BigInt(sign + digits), scale };
}

/** Ділення з округленням до найближчого цілого, ".5" — у бік +∞ (як `Math.round`); `den > 0`. */
function roundHalfUp(num: bigint, den: bigint): bigint {
  const a = 2n * num + den;
  const b = 2n * den;
  const q = a / b; // BigInt-ділення відкидає дробову частину до нуля
  return a % b !== 0n && a < 0n ? q - 1n : q;
}

/**
 * Розраховує ціну проєкту в центах з урахуванням знижки.
 *
 * Рахує точно: кожен вхід береться як десяткове число, яким його записано
 * (`0.145`, а не двійкове 0.14499999999999999), множення й знижка — у цілих
 * BigInt, і лише потім одне округлення. Тому межа ".5" не залежить від похибки
 * float ні на малих, ні на великих сумах.
 *
 * @param input.hours - кількість годин (може бути дробовим, напр. 2.5)
 * @param input.rateCents - ставка за годину, у центах
 * @param input.discountPercent - знижка у відсотках, 0..100 (за замовчуванням 0)
 * @returns підсумкову суму в центах — точне `hours × rateCents × (1 − discountPercent/100)`,
 *   округлене до найближчого цілого, ".5" — у бік більшого (як `Math.round`:
 *   14.5 → 15, −14.5 → −14). При discountPercent=0 — сума без знижки; при 100 — 0.
 * @throws {RangeError} якщо точний результат не вміщується в безпечне ціле `number`
 *   (|результат| > `Number.MAX_SAFE_INTEGER`): інакше `Number(...)` мовчки змінив би суму.
 */
export function estimateTotalCents(input: QuoteInput): number {
  const { hours, rateCents, discountPercent = 0 } = input;
  const h = toDecimal(hours);
  const r = toDecimal(rateCents);
  const d = toDecimal(discountPercent);
  // (100 − d) у тих самих одиницях 10^-d.scale
  const keep = 100n * 10n ** BigInt(d.scale) - d.n;
  const num = h.n * r.n * keep;
  const den = 10n ** BigInt(h.scale + r.scale + d.scale) * 100n;
  const cents = roundHalfUp(num, den);
  if (cents > BigInt(Number.MAX_SAFE_INTEGER) || cents < -BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`сума ${cents} центів поза межами безпечного цілого number`);
  }
  return Number(cents) + 0; // "+ 0" перетворює −0 на 0
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
 * обов'язково рівні: береться базова частка `base = ⌊totalCents / parts⌋` (рахується в BigInt),
 * а залишок від ділення (в цілих центах) додається по одному центу до перших
 * `remainder` платежів (вони отримують `base + 1`, решта — `base`).
 *
 * Гарантія — сума всіх елементів точно дорівнює `totalCents`, а платежі
 * відрізняються не більше ніж на 1 цент — діє за передумов, які функція
 * перевіряє сама: `totalCents` — ціле число центів у межах
 * `Number.MAX_SAFE_INTEGER`, `parts` — додатне ціле. Інакше — `RangeError`,
 * а не мовчки хибні гроші.
 *
 * @param totalCents - сума до розподілу, ціле число центів (може бути від'ємною — повернення)
 * @param parts - кількість платежів, додатне ціле
 * @returns масив довжиною `parts`, сума елементів якого дорівнює `totalCents`
 * @throws {RangeError} якщо `totalCents` не безпечне ціле або `parts` не додатне ціле
 */
export function splitInstallments(totalCents: number, parts: number): number[] {
  if (!Number.isSafeInteger(totalCents)) {
    throw new RangeError(`totalCents має бути цілим числом центів, отримано ${totalCents}`);
  }
  if (!Number.isSafeInteger(parts) || parts < 1) {
    throw new RangeError(`parts має бути додатним цілим, отримано ${parts}`);
  }
  // База й залишок — у BigInt: біля ±Number.MAX_SAFE_INTEGER добуток base * parts у double вже не точний
  // (−9007199254740993 округлюється), і залишок, а з ним і сума платежів, зсунулися б на цент.
  const total = BigInt(totalCents);
  const count = BigInt(parts);
  let q = total / count; // ділення BigInt відкидає дробову частину до нуля
  let r = total % count;
  if (r < 0n) {
    q -= 1n; // floor для від'ємних
    r += count;
  }
  const base = Number(q); // |q| ≤ |totalCents| — безпечне ціле
  const remainder = Number(r); // 0 ≤ r < parts
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
