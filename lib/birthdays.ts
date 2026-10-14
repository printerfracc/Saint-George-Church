import { ARABIC_MONTHS } from "@/lib/admin-labels";

export type BirthdayServant = {
  id: string;
  name: string;
  phone: string | null;
  nationalId: string | null;
  age: number;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
};

export type BirthdayGroups = {
  today: BirthdayServant[];
  upcoming: BirthdayServant[];
  recent: BirthdayServant[];
};

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function birthdayInYear(year: number, month: number, day: number) {
  const celebratedDay = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day;
  return new Date(year, month - 1, celebratedDay);
}

function dayDiff(from: Date, to: Date) {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / 86_400_000);
}

export function daysUntilNextBirthday(servant: BirthdayServant, today: Date) {
  const thisYear = dayDiff(
    today,
    birthdayInYear(today.getFullYear(), servant.birthMonth, servant.birthDay),
  );

  if (thisYear >= 0) {
    return thisYear;
  }

  return dayDiff(
    today,
    birthdayInYear(today.getFullYear() + 1, servant.birthMonth, servant.birthDay),
  );
}

export function birthdayOccursBetween(servant: BirthdayServant, start: Date, end: Date) {
  const rangeStart = start.getTime() <= end.getTime() ? start : end;
  const rangeEnd = start.getTime() <= end.getTime() ? end : start;

  for (let year = rangeStart.getFullYear() - 1; year <= rangeEnd.getFullYear() + 1; year += 1) {
    const occurrence = birthdayInYear(year, servant.birthMonth, servant.birthDay);
    const afterStart = dayDiff(rangeStart, occurrence) >= 0;
    const beforeEnd = dayDiff(occurrence, rangeEnd) >= 0;

    if (afterStart && beforeEnd) {
      return occurrence;
    }
  }

  return null;
}

export function birthdayDayOffset(servant: BirthdayServant, today: Date) {
  const year = today.getFullYear();
  const offsets = [year - 1, year, year + 1].map((candidate) =>
    dayDiff(today, birthdayInYear(candidate, servant.birthMonth, servant.birthDay)),
  );

  return offsets.reduce((closest, offset) =>
    Math.abs(offset) < Math.abs(closest) ? offset : closest,
  );
}

export function displayAge(servant: BirthdayServant, today: Date) {
  const birthday = birthdayInYear(today.getFullYear(), servant.birthMonth, servant.birthDay);
  let age = today.getFullYear() - servant.birthYear;

  if (dayDiff(today, birthday) > 0) {
    age -= 1;
  }

  return age;
}

export function formatBirthDate(month: number, day: number, year: number) {
  const label = ARABIC_MONTHS[month - 1]?.label ?? "";
  return `${day} ${label} ${year}`.trim();
}

export function groupBirthdays(servants: BirthdayServant[], today: Date): BirthdayGroups {
  const todayList: BirthdayServant[] = [];
  const upcoming: Array<{ servant: BirthdayServant; offset: number }> = [];
  const recent: Array<{ servant: BirthdayServant; offset: number }> = [];

  for (const servant of servants) {
    const offset = birthdayDayOffset(servant, today);

    if (offset === 0) {
      todayList.push(servant);
    } else if (offset >= 1 && offset <= 30) {
      upcoming.push({ servant, offset });
    } else if (offset <= -1 && offset >= -30) {
      recent.push({ servant, offset });
    }
  }

  const byOffsetThenName = (
    left: { servant: BirthdayServant; offset: number },
    right: { servant: BirthdayServant; offset: number },
  ) =>
    left.offset - right.offset || left.servant.name.localeCompare(right.servant.name, "ar");

  todayList.sort((left, right) => left.name.localeCompare(right.name, "ar"));
  upcoming.sort(byOffsetThenName);
  recent.sort(
    (left, right) =>
      right.offset - left.offset || left.servant.name.localeCompare(right.servant.name, "ar"),
  );

  return {
    today: todayList,
    upcoming: upcoming.map((item) => item.servant),
    recent: recent.map((item) => item.servant),
  };
}

export function formatEgyptianWhatsAppPhone(phone: string | null) {
  const digits = phone?.replace(/\D/g, "") ?? "";

  if (!digits) {
    return null;
  }

  if (digits.startsWith("0")) {
    return `20${digits.slice(1)}`;
  }

  if (digits.startsWith("20")) {
    return digits;
  }

  return `20${digits}`;
}

export function whatsAppBirthdayHref(servant: BirthdayServant) {
  const formattedPhone = formatEgyptianWhatsAppPhone(servant.phone);

  if (!formattedPhone) {
    return null;
  }

  const firstName = servant.name.trim().split(/\s+/)[0] || servant.name;
  const message = encodeURIComponent(
    `كل سنة وأنت طيب يا ${firstName}، وعقبال سنين كتير حلوة مع ربنا \u{1F382}\u{1F389}`,
  );

  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${message}`;
}

export function relativeBirthdayLabel(offset: number) {
  if (offset === 0) {
    return "اليوم";
  }

  if (offset === 1) {
    return "غداً";
  }

  if (offset === -1) {
    return "أمس";
  }

  if (offset > 1) {
    return `بعد ${offset} أيام`;
  }

  return `منذ ${Math.abs(offset)} أيام`;
}
