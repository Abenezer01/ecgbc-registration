/**
 * Date utilities for converting between Gregorian and Ethiopian calendars.
 * This implementation uses an approximation; for production consider using a
 * dedicated library like 'ethiopic-date' or 'ethiopic-calendar'.
 */

/**
 * Convert a Gregorian date string (ISO) to an approximate Ethiopian date string.
 * Returns format "yyyy-MM-dd" (Ethiopian calendar).
 * @param isoDateString ISO 8601 date string (e.g., "2025-06-15T10:30:00Z")
 * @returns Ethiopian date string in "yyyy-MM-dd" format
 */
export function formatEthiopianDate(isoDateString: string): string {
  if (!isoDateString) return "";
  const date = new Date(isoDateString);
  // Ethiopian year is roughly Gregorian year minus 8 (if before Sept) or 7 (after)
  // Ethiopian months start on September 11/12 (Gregorian). We'll use a simple offset.
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth(); // 0 = Jan
  const ethiopianYear = gregorianMonth < 8 // before August (Sep) => subtract 8 else subtract 7
    ? gregorianYear - 8
    : gregorianYear - 7;
  // For simplicity, we keep the same month/day; this is not accurate.
  // A proper conversion would require more complex math.
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${ethiopianYear}-${month}-${day}`;
}

/**
 * Format a Gregorian date string to a short locale-specific string.
 * Defaults to 'MM/dd/yyyy' (en-US) if no options provided.
 * @param isoDateString ISO 8601 date string
 * @param options Intl.DateTimeFormatOptions (optional)
 * @returns Formatted date string
 */
export function formatGregorianDate(
  isoDateString: string,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" }
): string {
  if (!isoDateString) return "";
  return new Date(isoDateString).toLocaleDateString(undefined, options);
}

/**
 * Get the current Ethiopian year (approximate).
 * Uses the same logic as the original getCurrentEthYear function.
 */
export function getCurrentEthYear(): number {
  const date = new Date();
  return date.getFullYear() - (date.getMonth() < 8 ? 8 : 7);
}

/**
 * Convert an Ethiopian year range to a list of Gregorian years for labeling.
 * This mimics the original loop that creates columns for each year from 2013 to current Ethiopian year.
 * @param startGregorianYear The Gregorian year to start from (inclusive)
 * @param endEthiopianYear The Ethiopian year to end at (inclusive)
 * @returns Array of Gregorian years corresponding to the Ethiopian years in the range
 */
export function getEthiopianYearRange(
  startGregorianYear: number,
  endEthiopianYear: number
): number[] {
  // Ethiopian year E ≈ Gregorian year G - 8 (before Sep) or -7 (after Sep)
  // For simplicity, we'll map Ethiopian year to Gregorian year by adding 7 (midpoint)
  // This is just to generate a list of years for column headers; exact conversion not needed.
  const years: number[] = [];
  for (let ethYear = 1900; ethYear <= endEthiopianYear; ethYear++) {
    // Approximate Gregorian year = ethYear + 7
    years.push(ethYear + 7);
  }
  // Filter to start from startGregorianYear
  return years.filter((y) => y >= startGregorianYear);
}