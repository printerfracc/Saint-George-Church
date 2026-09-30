export function calendarYear() {
  return new Date().getFullYear();
}

export function parseYear(value?: string | null, fallback = calendarYear()) {
  if (!value || !/^\d+$/.test(value.trim())) {
    return fallback;
  }

  const year = Number(value);
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    return fallback;
  }

  return year;
}
