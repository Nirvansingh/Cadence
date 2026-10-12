export type HabitCategory = 'study' | 'coding' | 'health' | 'routine' | 'mindset';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'anytime';

export interface Habit {
  id: string;
  title: string;
  category: HabitCategory;
  timeOfDay: TimeOfDay;
  cue: string;
  routine: string;
  reward: string;
  icon?: string;
  color?: string;
  targetDaysMask: number; // 1=Mon, 2=Tue, 4=Wed, 8=Thu, 16=Fri, 32=Sat, 64=Sun (127=daily)
  sortOrder: number;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  completedDate: string; // 'YYYY-MM-DD'
  completedAt: number;
  notes?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type TimetableCategory = 'school' | 'tuition' | 'study' | 'workout' | 'meals' | 'sleep' | 'other';

export interface TimetableSlot {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // 'HH:MM' 24hr
  endTime: string;   // 'HH:MM' 24hr
  title: string;
  category: TimetableCategory;
  note?: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  tags: string[];
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  timezone: string;
  theme: string;
  soundEnabled: boolean;
  autoLockMinutes: number;
  createdAt: number;
  updatedAt: number;
}

export interface CadenceBackupData {
  version: string;
  exportedAt: string;
  profile: UserProfile;
  habits: Habit[];
  habitLogs: HabitLog[];
  timetable: TimetableSlot[];
  notes: NoteItem[];
  tasks: TaskItem[];
}
