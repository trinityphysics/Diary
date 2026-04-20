import type { ClassInfo, Task, Reminder, AnxietyLog, CheckingLog, BrainDump, AppSettings } from '../types';

const KEYS = {
  classes: 'diary_classes',
  tasks: 'diary_tasks',
  reminders: 'diary_reminders',
  anxietyLogs: 'diary_anxiety_logs',
  checkingLogs: 'diary_checking_logs',
  brainDumps: 'diary_brain_dumps',
  settings: 'diary_settings',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getClasses: (): ClassInfo[] => getItem(KEYS.classes, []),
  setClasses: (v: ClassInfo[]) => setItem(KEYS.classes, v),

  getTasks: (): Task[] => getItem(KEYS.tasks, []),
  setTasks: (v: Task[]) => setItem(KEYS.tasks, v),

  getReminders: (): Reminder[] => getItem(KEYS.reminders, getDefaultReminders()),
  setReminders: (v: Reminder[]) => setItem(KEYS.reminders, v),

  getAnxietyLogs: (): AnxietyLog[] => getItem(KEYS.anxietyLogs, []),
  setAnxietyLogs: (v: AnxietyLog[]) => setItem(KEYS.anxietyLogs, v),

  getCheckingLogs: (): CheckingLog[] => getItem(KEYS.checkingLogs, []),
  setCheckingLogs: (v: CheckingLog[]) => setItem(KEYS.checkingLogs, v),

  getBrainDumps: (): BrainDump[] => getItem(KEYS.brainDumps, []),
  setBrainDumps: (v: BrainDump[]) => setItem(KEYS.brainDumps, v),

  getSettings: (): AppSettings => getItem(KEYS.settings, {
    breakTimeOption: 'early' as const,
    notificationsEnabled: false,
    userName: 'Teacher',
  }),
  setSettings: (v: AppSettings) => setItem(KEYS.settings, v),
};

function getDefaultReminders(): Reminder[] {
  return [
    { id: '1', text: 'Take attendance register', type: 'start-period', active: true, isPriorityEveryLesson: true },
    { id: '2', text: 'Pack marking books', type: 'end-period', active: true, isPriorityEveryLesson: false },
    { id: '3', text: 'Check lesson resources are ready', type: 'before-school', active: true, isPriorityEveryLesson: false },
    { id: '4', text: 'Eat lunch and hydrate', type: 'lunch', active: true, isPriorityEveryLesson: false },
    { id: '5', text: 'Pack bag for tomorrow', type: 'after-school', active: true, isPriorityEveryLesson: false },
  ];
}
