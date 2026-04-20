import type { ClassInfo, Task, Reminder, AnxietyLog, CheckingLog, BrainDump, AppSettings, SleepLog, SleepSettings, DepartureItem, DepartureLog } from '../types';

const KEYS = {
  classes: 'diary_classes',
  tasks: 'diary_tasks',
  reminders: 'diary_reminders',
  anxietyLogs: 'diary_anxiety_logs',
  checkingLogs: 'diary_checking_logs',
  brainDumps: 'diary_brain_dumps',
  settings: 'diary_settings',
  sleepLogs: 'diary_sleep_logs',
  sleepSettings: 'diary_sleep_settings',
  departureItems: 'diary_departure_items',
  departureLogs: 'diary_departure_logs',
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

  getSleepLogs: (): SleepLog[] => getItem(KEYS.sleepLogs, []),
  setSleepLogs: (v: SleepLog[]) => setItem(KEYS.sleepLogs, v),

  getSleepSettings: (): SleepSettings => {
    const defaults: SleepSettings = { targetBedtime: '22:30', targetWakeTime: '07:00', ouraToken: '', windDownMinutes: 60 };
    return getItem<SleepSettings>(KEYS.sleepSettings, defaults);
  },
  setSleepSettings: (v: SleepSettings) => setItem(KEYS.sleepSettings, v),

  getDepartureItems: (): DepartureItem[] => getItem(KEYS.departureItems, getDefaultDepartureItems()),
  setDepartureItems: (v: DepartureItem[]) => setItem(KEYS.departureItems, v),

  getDepartureLogs: (): DepartureLog[] => getItem(KEYS.departureLogs, []),
  setDepartureLogs: (v: DepartureLog[]) => setItem(KEYS.departureLogs, v),

  getSettings: (): AppSettings => {
    const defaultSettings: AppSettings = {
      breakOptions: ['early', 'early', 'early', 'early', 'early'],
      notificationsEnabled: false,
      userName: 'Teacher',
    };
    const stored = getItem<Partial<AppSettings> & { breakTimeOption?: 'early' | 'late' }>(KEYS.settings, defaultSettings);
    // Migrate old single breakTimeOption to per-day breakOptions
    if (!stored.breakOptions && stored.breakTimeOption) {
      stored.breakOptions = [stored.breakTimeOption, stored.breakTimeOption, stored.breakTimeOption, stored.breakTimeOption, stored.breakTimeOption];
    } else if (!stored.breakOptions) {
      stored.breakOptions = defaultSettings.breakOptions;
    }
    return stored as AppSettings;
  },
  setSettings: (v: AppSettings) => setItem(KEYS.settings, v),
};

function getDefaultDepartureItems(): DepartureItem[] {
  return [
    { id: 'd1', label: 'Hob / oven off' },
    { id: 'd2', label: 'Front door locked' },
    { id: 'd3', label: 'Back door locked' },
    { id: 'd4', label: 'Car handbrake on' },
    { id: 'd5', label: 'Car locked' },
  ];
}

function getDefaultReminders(): Reminder[] {
  return [
    { id: '1', text: 'Take attendance register', type: 'start-period', active: true, isPriorityEveryLesson: true },
    { id: '2', text: 'Pack marking books', type: 'end-period', active: true, isPriorityEveryLesson: false },
    { id: '3', text: 'Check lesson resources are ready', type: 'before-school', active: true, isPriorityEveryLesson: false },
    { id: '4', text: 'Eat lunch and hydrate', type: 'lunch', active: true, isPriorityEveryLesson: false },
    { id: '5', text: 'Pack bag for tomorrow', type: 'after-school', active: true, isPriorityEveryLesson: false },
  ];
}
