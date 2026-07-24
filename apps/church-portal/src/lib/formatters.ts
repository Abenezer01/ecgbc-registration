/**
 * Global formatter utilities for consistent number and date formatting across the application
 */

// Number Formatting
export const formatCurrency = (
  amount: number | string,
  currency: string = "ETB",
  locale: string = "en-ET"
): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

export const formatNumber = (
  value: number | string,
  locale: string = "en-ET",
  options?: Intl.NumberFormatOptions
): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  return new Intl.NumberFormat(locale, options).format(numValue);
};

export const formatPercentage = (
  value: number | string,
  locale: string = "en-ET",
  decimals: number = 1
): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue / 100);
};

export const formatCompactNumber = (
  value: number | string,
  locale: string = "en-ET"
): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
  }).format(numValue);
};

// Date Formatting
export const formatDate = (
  date: string | Date,
  format: "short" | "medium" | "long" | "full" = "medium",
  locale: string = "en-ET"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return "Invalid Date";
  
  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { year: "numeric", month: "short", day: "numeric" },
    medium: { year: "numeric", month: "long", day: "numeric" },
    long: { 
      year: "numeric", 
      month: "long", 
      day: "numeric",
      weekday: "long"
    },
    full: {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    },
  };
  
  return new Intl.DateTimeFormat(locale, formatOptions[format]).format(dateObj);
};

export const formatDateTime = (
  date: string | Date,
  locale: string = "en-ET"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return "Invalid Date";
  
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
};

export const formatTime = (
  date: string | Date,
  locale: string = "en-ET"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return "Invalid Date";
  
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
};

export const formatRelativeTime = (
  date: string | Date,
  locale: string = "en-ET"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (isNaN(dateObj.getTime())) return "Invalid Date";
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, "second");
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), "month");
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), "year");
  }
};

export const formatYear = (
  date: string | Date,
  locale: string = "en-ET"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return "Invalid Date";
  
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
  }).format(dateObj);
};

export const formatMonthYear = (
  date: string | Date,
  locale: string = "en-ET"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return "Invalid Date";
  
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
  }).format(dateObj);
};

// Utility Functions
export const isValidDate = (date: string | Date): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return !isNaN(dateObj.getTime());
};

export const getAge = (birthDate: string | Date): number => {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const today = new Date();
  
  if (isNaN(birth.getTime())) return 0;
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const formatPhoneNumber = (
  phoneNumber: string,
  format: "international" | "national" = "national"
): string => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");
  
  if (cleaned.length === 0) return phoneNumber;
  
  // Ethiopian phone number formatting
  if (cleaned.startsWith("251")) {
    // International format: +251 911 234 567
    if (format === "international") {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
    // National format: 0911 234 567
    return `0${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  
  // Default formatting for other numbers
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phoneNumber;
};

export const truncateText = (
  text: string,
  maxLength: number,
  suffix: string = "..."
): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};

export const capitalizeFirst = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text: string): string => {
  if (!text) return text;
  return text
    .split(" ")
    .map((word) => capitalizeFirst(word))
    .join(" ");
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
