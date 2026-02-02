/**
 * Utility functions for formatting Firebase Timestamps and dates
 */

/**
 * Format a Firebase Timestamp or date value to a locale string (date + time)
 */
export function formatDate(dateValue: any): string {
  if (!dateValue) return "N/A";

  try {
    let date: Date;

    // Handle Firebase Timestamp format {_seconds, _nanoseconds}
    if (dateValue._seconds !== undefined) {
      date = new Date(dateValue._seconds * 1000);
    }
    // Handle alternative format {seconds, nanoseconds}
    else if (dateValue.seconds !== undefined) {
      date = new Date(dateValue.seconds * 1000);
    }
    // Handle string or number
    else {
      date = new Date(dateValue);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleString();
  } catch (e) {
    return "Invalid Date";
  }
}

/**
 * Format a Firebase Timestamp or date value to a locale date string (date only)
 */
export function formatDateOnly(dateValue: any): string {
  if (!dateValue) return "N/A";

  try {
    let date: Date;

    if (dateValue._seconds !== undefined) {
      date = new Date(dateValue._seconds * 1000);
    } else if (dateValue.seconds !== undefined) {
      date = new Date(dateValue.seconds * 1000);
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString();
  } catch (e) {
    return "N/A";
  }
}

/**
 * Format a Firebase Timestamp or date value to a locale time string (time only)
 */
export function formatTimeOnly(dateValue: any): string {
  if (!dateValue) return "N/A";

  try {
    let date: Date;

    if (dateValue._seconds !== undefined) {
      date = new Date(dateValue._seconds * 1000);
    } else if (dateValue.seconds !== undefined) {
      date = new Date(dateValue.seconds * 1000);
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleTimeString();
  } catch (e) {
    return "N/A";
  }
}

/**
 * Format a Firebase Timestamp with custom options
 */
export function formatDateCustom(dateValue: any, options: Intl.DateTimeFormatOptions): string {
  if (!dateValue) return "N/A";

  try {
    let date: Date;

    if (dateValue._seconds !== undefined) {
      date = new Date(dateValue._seconds * 1000);
    } else if (dateValue.seconds !== undefined) {
      date = new Date(dateValue.seconds * 1000);
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-US", options);
  } catch (e) {
    return "N/A";
  }
}

/**
 * Convert a Firebase Timestamp or date value to a Date object
 */
export function toDateObject(dateValue: any): Date | null {
  if (!dateValue) return null;

  try {
    let date: Date;

    if (dateValue._seconds !== undefined) {
      date = new Date(dateValue._seconds * 1000);
    } else if (dateValue.seconds !== undefined) {
      date = new Date(dateValue.seconds * 1000);
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch (e) {
    return null;
  }
}
