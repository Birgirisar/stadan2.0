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

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
