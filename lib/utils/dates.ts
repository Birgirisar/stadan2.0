const SHORT_LABELS = ['Sun', 'Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau'];
const FULL_NAMES = [
  'Sunnudagur',
  'Mánudagur',
  'Þriðjudagur',
  'Miðvikudagur',
  'Fimmtudagur',
  'Föstudagur',
  'Laugardagur',
];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maí', 'jún', 'júl', 'ágú', 'sep', 'okt', 'nóv', 'des'];
const MONTHS_CAPITALIZED = [
  'Janúar', 'Febrúar', 'Mars', 'Apríl', 'Maí', 'Júní',
  'Júlí', 'Ágúst', 'September', 'Október', 'Nóvember', 'Desember',
];

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getWeekDays(center: Date, spread = 3): Date[] {
  return Array.from({ length: spread * 2 + 1 }, (_, i) => {
    const d = new Date(center);
    d.setDate(center.getDate() + i - spread);
    return d;
  });
}

export function getDayLabel(date: Date, isToday: boolean): string {
  return isToday ? 'Í dag' : SHORT_LABELS[date.getDay()];
}

export function getSectionHeading(date: Date): string {
  return `${FULL_NAMES[date.getDay()]} · ${date.getDate()}. ${MONTHS[date.getMonth()]}`;
}

export function formatKickoffTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('is-IS', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Atlantic/Reykjavik',
      hour12: false,
    });
  } catch {
    return '--:--';
  }
}

export function formatStartDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return `${date.getDate()}. ${MONTHS[date.getMonth()]}`;
  } catch {
    return '';
  }
}

// Returns "Í dag", "Á morgun", or "14. júní" — all in Reykjavik time.
export function formatMatchDate(isoString: string): string {
  try {
    const tz = 'Atlantic/Reykjavik';
    const date = new Date(isoString);
    const now = new Date();

    const fmt = (d: Date) =>
      d.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz });

    const matchStr = fmt(date);
    const todayStr = fmt(now);
    const tomorrowStr = fmt(new Date(now.getTime() + 86_400_000));

    if (matchStr === todayStr) return 'Í dag';
    if (matchStr === tomorrowStr) return 'Á morgun';

    const [, mm, dd] = matchStr.split('-');
    return `${parseInt(dd)}. ${MONTHS[parseInt(mm) - 1]}`;
  } catch {
    return '';
  }
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Returns "Maí 2025", "Júní 2026" etc. — for month section headers in fixture lists.
export function formatMonthYear(isoString: string): string {
  try {
    const date = new Date(isoString);
    const tz = 'Atlantic/Reykjavik';
    const monthStr = date.toLocaleDateString('en-CA', { month: '2-digit', timeZone: tz });
    const year = date.toLocaleDateString('en-CA', { year: 'numeric', timeZone: tz });
    return `${MONTHS_CAPITALIZED[parseInt(monthStr, 10) - 1]} ${year}`;
  } catch {
    return '';
  }
}

// Returns "YYYY-MM" key for grouping fixtures by month in Reykjavik time.
export function getMonthKey(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      timeZone: 'Atlantic/Reykjavik',
    }).slice(0, 7);
  } catch {
    return '';
  }
}
