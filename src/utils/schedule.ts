import type { AppSettings } from '../types';

export interface PeriodInfo {
  index: number;
  label: string;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
  isLunch?: boolean;
  isTutor?: boolean;
}

type BreakOption = AppSettings['breakOptions'][number];

export function getPeriods(dayIndex: number, breakOption: BreakOption): PeriodInfo[] {
  const periods: PeriodInfo[] = [];

  periods.push({ index: 0, label: 'Period 1', startTime: '08:45', endTime: '09:35' });
  periods.push({ index: 1, label: 'Period 2', startTime: '09:35', endTime: '10:25' });

  if (breakOption === 'early') {
    periods.push({ index: -1, label: 'Break', startTime: '10:25', endTime: '10:40', isBreak: true });
    periods.push({ index: 2, label: 'Period 3', startTime: '10:40', endTime: '11:30' });
    periods.push({ index: 3, label: 'Period 4', startTime: '11:30', endTime: '12:20' });
    periods.push({ index: 4, label: 'Period 5', startTime: '12:20', endTime: '13:10' });
  } else {
    periods.push({ index: 2, label: 'Period 3', startTime: '10:25', endTime: '11:15' });
    periods.push({ index: -1, label: 'Break', startTime: '11:15', endTime: '11:30', isBreak: true });
    periods.push({ index: 3, label: 'Period 4', startTime: '11:30', endTime: '12:20' });
    periods.push({ index: 4, label: 'Period 5', startTime: '12:20', endTime: '13:10' });
  }

  periods.push({ index: -2, label: 'Lunch', startTime: '13:10', endTime: '13:50', isLunch: true });
  periods.push({ index: 5, label: 'Period 6', startTime: '13:50', endTime: '14:40' });

  if (dayIndex === 0 || dayIndex === 2) {
    periods.push({ index: 6, label: 'Tutor', startTime: '14:40', endTime: '15:05', isTutor: true });
  } else if (dayIndex === 1 || dayIndex === 3) {
    periods.push({ index: 6, label: 'Period 7', startTime: '14:40', endTime: '15:30' });
  }

  return periods;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function getCurrentPeriod(dayIndex: number, breakOption: BreakOption): PeriodInfo | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const periods = getPeriods(dayIndex, breakOption);
  return periods.find(p => {
    const start = timeToMinutes(p.startTime);
    const end = timeToMinutes(p.endTime);
    return currentMinutes >= start && currentMinutes < end;
  }) || null;
}

export function getNextPeriod(dayIndex: number, breakOption: BreakOption): PeriodInfo | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const periods = getPeriods(dayIndex, breakOption);
  return periods.find(p => timeToMinutes(p.startTime) > currentMinutes) || null;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')}${ampm}`;
}

export function getMinutesUntil(time: string): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return timeToMinutes(time) - currentMinutes;
}

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const PERIOD_LABELS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'];
