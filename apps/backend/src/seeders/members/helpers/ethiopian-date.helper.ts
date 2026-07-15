import { toGregorian } from "ethiopian-date";

/**
 * Converts Ethiopian date (DD/MM/YYYY, DD-MM-YYYY, or ISO) to Gregorian Date object.
 * @param ethiopianDate - Date string in DD/MM/YYYY, DD-MM-YYYY, or ISO format.
 * @param row - Optional row number for error tracking.
 * @returns Gregorian Date object.
 * @throws Error if input is invalid.
 */
export function ethToGreg(ethiopianDate: string, row?: number): Date {
  try {
    let day: number, month: number, year: number;

    // Handle ISO format (e.g., "2014-01-06T00:00:00.000Z")
    if (typeof ethiopianDate !== "string") {
      const date = new Date(ethiopianDate);
      if (isNaN(date.getTime())) throw new Error("Invalid ISO date.");
      const yearNo = date.getFullYear(); // 2014
      const dayOfMonth = date.getMonth() + 1; // 1 (January)
      const monthNo = date.getDate();
      if (row == 2) {
        console.log("yearNo", yearNo);
        console.log("monthNo", monthNo);
        console.log("dayOfMonth", dayOfMonth);
      }
      // Validate Ethiopian date (month 1-13, valid day/year)
      if (
        isNaN(dayOfMonth) ||
        isNaN(monthNo) ||
        isNaN(yearNo) ||
        monthNo < 1 ||
        monthNo > 13 ||
        dayOfMonth < 1 ||
        dayOfMonth > 30 // Adjust for Pagume (monthNo 13) if needed
      ) {
        throw new Error(
          `Invalid Ethiopian date. Expected DD/MM/YYYY with monthNo 1-13. Got: ${ethiopianDate}`
        );
      }

      // Convert to Gregorian
      const [gYear, gMonth, gDay] = toGregorian(yearNo, monthNo, dayOfMonth);
      return new Date(Date.UTC(gYear, gMonth - 1, gDay));
    } else {
      // Handle DD/MM/YYYY or DD-MM-YYYY
      const parts = ethiopianDate.split(/[/-]/);
      if (parts.length !== 3) {
        throw new Error(
          `Invalid Ethiopian date format. Expected DD/MM/YYYY or DD-MM-YYYY. Got: ${ethiopianDate}`
        );
      }

      [day, month, year] = parts.map(Number);

      // Validate Ethiopian date (month 1-13, valid day/year)
      if (
        isNaN(day) ||
        isNaN(month) ||
        isNaN(year) ||
        month < 1 ||
        month > 13 ||
        day < 1 ||
        day > 30 // Adjust for Pagume (month 13) if needed
      ) {
        throw new Error(
          `Invalid Ethiopian date. Expected DD/MM/YYYY with month 1-13. Got: ${ethiopianDate}`
        );
      }

      // Convert to Gregorian
      const [gYear, gMonth, gDay] = toGregorian(year, month, day);
      return new Date(Date.UTC(gYear, gMonth - 1, gDay));
    }
  } catch (error) {
    console.log(typeof ethiopianDate, ethiopianDate);

    console.error(`Error in row ${row}:`, {
      // input: ethiopianDate,
      // normalized: ethiopianDate.replace(/-/g, "/"),
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`Failed to convert Ethiopian date: ${ethiopianDate}`);
  }
}
