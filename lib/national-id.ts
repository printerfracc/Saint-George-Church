export type ParsedNationalId = {
  dateOfBirth: Date | null;
  age: number | null;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function completedAge(dateOfBirth: Date, today: Date) {
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }

  return age;
}

export function parseNationalId(id: string, today = new Date()): ParsedNationalId {
  const digits = id.replace(/\D/g, "");

  if (digits.length !== 14) {
    return { dateOfBirth: null, age: null };
  }

  const century = digits[0] === "2" ? 1900 : digits[0] === "3" ? 2000 : null;

  if (century == null) {
    return { dateOfBirth: null, age: null };
  }

  const year = century + Number(digits.slice(1, 3));
  const month = Number(digits.slice(3, 5));
  const day = Number(digits.slice(5, 7));
  const dateOfBirth = new Date(year, month - 1, day);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    dateOfBirth.getFullYear() !== year ||
    dateOfBirth.getMonth() !== month - 1 ||
    dateOfBirth.getDate() !== day ||
    startOfDay(dateOfBirth).getTime() > startOfDay(today).getTime()
  ) {
    return { dateOfBirth: null, age: null };
  }

  return {
    dateOfBirth,
    age: completedAge(dateOfBirth, today),
  };
}
