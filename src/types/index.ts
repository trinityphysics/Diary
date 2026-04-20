export interface ClassInfo {
  id: string;
  name: string;
  room: string;
  dayIndex: number;
  periodIndex: number;
  notes: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  dueDate: string;
  periodTag?: number;
  dayTag?: number;
  createdAt: string;
}

export interface Reminder {
  id: string;
  text: string;
  type: 'before-school' | 'start-period' | 'end-period' | 'break' | 'lunch' | 'after-school';
  periodIndex?: number;
  active: boolean;
  isPriorityEveryLesson: boolean;
}

export interface AnxietyLog {
  id: string;
  level: number;
  notes: string;
  trigger: string;
  timestamp: string;
}

export interface CheckingLog {
  id: string;
  item: string;
  count: number;
  timestamp: string;
  notes: string;
}

export interface BrainDump {
  id: string;
  text: string;
  timestamp: string;
}

export interface AppSettings {
  breakTimeOption: 'early' | 'late';
  notificationsEnabled: boolean;
  userName: string;
}

export type TabType = 'dashboard' | 'schedule' | 'tasks' | 'reminders' | 'ocd' | 'adhd' | 'settings';
