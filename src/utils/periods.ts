export type TransactionPeriod = 'day' | 'week' | 'month' | 'year';

export const toLocalDateKey = (date: Date | string = new Date()) => {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsed.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getPeriodRange = (period: TransactionPeriod, baseDate: Date = new Date()) => {
  if (period === 'day') {
    const start = new Date(baseDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { start: start.getTime(), end: end.getTime() };
  }

  if (period === 'week') {
    const start = new Date(baseDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start: start.getTime(), end: end.getTime() };
  }

  if (period === 'month') {
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 0, 0);
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1, 0, 0, 0);
    return { start: start.getTime(), end: end.getTime() };
  }

  const start = new Date(baseDate.getFullYear(), 0, 1, 0, 0, 0);
  const end = new Date(baseDate.getFullYear() + 1, 0, 1, 0, 0, 0);
  return { start: start.getTime(), end: end.getTime() };
};

export const isTimestampInRange = (timestamp: string, range: { start: number; end: number }) => {
  const time = new Date(timestamp).getTime();
  return !Number.isNaN(time) && time >= range.start && time < range.end;
};
