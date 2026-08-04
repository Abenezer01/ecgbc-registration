/**
 * Date utilities for converting between Gregorian and Ethiopian calendars.
 */

// ── Ethiopian month names (Ge'ez / Amharic) ──────────────────────────────────
const ETH_MONTHS = [
  "መስከረም", // 1
  "ጥቅምት",   // 2
  "ህዳር",    // 3
  "ታህሳስ",   // 4
  "ጥር",     // 5
  "የካቲት",   // 6
  "መጋቢት",   // 7
  "ሚያዚያ",   // 8
  "ግንቦት",   // 9
  "ሰኔ",     // 10
  "ሐምሌ",    // 11
  "ነሐሴ",    // 12
  "ጳጉሜ",   // 13 (intercalary month)
];

/**
 * Convert a Gregorian date to Ethiopian calendar components.
 * Uses the standard JDN-based algorithm.
 */
function toEthiopian(gYear: number, gMonth: number, gDay: number): { year: number; month: number; day: number } {
  const jd = gregorianToJDN(gYear, gMonth, gDay);
  const ETHIOPIAN_EPOCH = 1723856;
  const r = (jd - ETHIOPIAN_EPOCH) % 1461;
  const n = r % 365 + 365 * Math.floor(r / 1460);

  const year = 4 * Math.floor((jd - ETHIOPIAN_EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;

  return { year, month, day };
}

function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

/**
 * Convert a Gregorian date string (ISO) to an Ethiopian date formatted as
 * "MMM DD, YYYY" where MMM is the Amharic month name.
 *
 * @example
 *   formatEthiopianDate("2025-09-11") → "ጳጉሜ 06, 2017"
 *   formatEthiopianDate("2024-01-07") → "ታህሳስ 28, 2016"
 */
export function formatEthiopianDate(isoDateString: string): string {
  if (!isoDateString) return "";
  try {
    // Parse as local date to avoid timezone shifting the day
    const [yearStr, monthStr, dayStr] = isoDateString.split("T")[0].split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return "";

    const eth = toEthiopian(year, month, day);
    const monthName = ETH_MONTHS[eth.month - 1] ?? `M${eth.month}`;
    const dayPadded = String(eth.day).padStart(2, "0");
    return `${monthName} ${dayPadded}, ${eth.year}`;
  } catch {
    return "";
  }
}

/**
 * Format a Gregorian date string to a short locale-specific string.
 */
export function formatGregorianDate(
  isoDateString: string,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" }
): string {
  if (!isoDateString) return "";
  return new Date(isoDateString).toLocaleDateString(undefined, options);
}

/**
 * Get the current Ethiopian year.
 */
export function getCurrentEthYear(): number {
  const d = new Date();
  const eth = toEthiopian(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return eth.year;
}

/**
 * Convert an Ethiopian year range to a list of Gregorian years for labeling.
 */
export function getEthiopianYearRange(
  startGregorianYear: number,
  endEthiopianYear: number
): number[] {
  const years: number[] = [];
  for (let ethYear = 1900; ethYear <= endEthiopianYear; ethYear++) {
    years.push(ethYear + 7);
  }
  return years.filter((y) => y >= startGregorianYear);
}
