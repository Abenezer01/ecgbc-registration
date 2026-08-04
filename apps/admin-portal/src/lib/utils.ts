import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with thousands separators
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string (e.g., "1,234.56")
 */
export function formatNumber(value: number | string | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined || value === "") return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a currency amount with thousands separators and currency symbol
 * @param value - The amount to format
 * @param currency - Currency code (default: "ETB")
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted currency string (e.g., "1,234 ETB")
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = "ETB",
  decimals: number = 0
): string {
  if (value === null || value === undefined || value === "") return `0 ${currency}`;
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return `0 ${currency}`;
  return `${num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${currency}`;
}

/**
 * Format a percentage
 * @param value - The decimal value (e.g., 0.75 for 75%)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string (e.g., "75%")
 */
export function formatPercentage(value: number | string | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined || value === "") return "0%";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0%";
  return `${(num * 100).toFixed(decimals)}%`;
}
