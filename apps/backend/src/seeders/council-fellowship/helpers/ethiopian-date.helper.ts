import { toGregorian } from "ethiopian-date";

/**
 * Converts Ethiopian date (DD/MM/YYYY) to Gregorian Date object
 * @param ethiopianDate - Date string in DD/MM/YYYY format
 * @returns Gregorian Date object
 */
export function ethToGreg(ethiopianDate: string): Date {
  const [day, month, year] = ethiopianDate.split("/").map(Number);
  //   console.log("day", day);
  //   console.log("month", month);
  //   console.log("year", year);

  // Validate input
  if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 13) {
    throw new Error(
      "Invalid Ethiopian date. Expected DD/MM/YYYY with month 1-13."
    );
  }

  const [gYear, gMonth, gDay] = toGregorian(year, month, day);
  //   console.log("g-day", gDay);
  //   console.log("g-month", gMonth);
  //   console.log("g-year", gYear);
  return new Date(Date.UTC(gYear, gMonth - 1, gDay));
}

// Example usage
const ethDate = "26/05/2013";
const gregDate = ethToGreg(ethDate);
console.log(gregDate.toLocaleDateString()); // "3/2/2021" (Feb 3, 2021)
