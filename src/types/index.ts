export type HabitCategory = 'study' | 'coding' | 'health' | 'routine' | 'mindset';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'anytime';

export interface Habit {
  id: string;
  user_id?: string;
  title: string;
  category: HabitCategory;
  timeOfDay: TimeOfDay;
  cue: string;
  routine: string;
  reward: string;
  icon?: string;
  color?: string;
  targetDaysMask: number; // 1=Mon, 2=Tue, 4=Wed, 8=Thu, 16=Fri, 32=Sat, 64=Sun (127=daily)
  frequency?: 'daily' | 'weekdays';
  stackAfterHabitId?: string;
  sortOrder: number;
  isArchived: boolean;
  is_deleted?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface FocusLog {
  id: string;
  user_id?: string;
  dateStr: string; // 'YYYY-MM-DD'
  minutes: number;
  timestamp: number;
  is_deleted?: boolean;
}

export interface HabitLog {
  id: string;
  user_id?: string;
  habitId: string;
  completedDate: string; // 'YYYY-MM-DD'
  completedAt: number;
  notes?: string;
  is_deleted?: boolean;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type TimetableCategory = 'school' | 'tuition' | 'study' | 'workout' | 'meals' | 'sleep' | 'other';

export interface TimetableSlot {
  id: string;
  user_id?: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // 'HH:MM' 24hr
  endTime: string;   // 'HH:MM' 24hr
  title: string;
  category: TimetableCategory;
  note?: string;
  sortOrder: number;
  is_deleted?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NoteItem {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  is_deleted?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  title: string;
  isDone: boolean;
}

export interface TaskItem {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  tags: string[];
  subtasks?: Subtask[];
  sortOrder: number;
  is_deleted?: boolean;
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
  focusLogs?: FocusLog[];
}

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string; // 'YYYY-MM-DD'
  freezesAvailable: number; // 0, 1, or 2
  freezeDates: string[]; // List of 'YYYY-MM-DD' when freeze was consumed
  activeDates: string[]; // List of 'YYYY-MM-DD' when activity occurred
}

export interface FriendProfile {
  id: string;
  friendCode: string; // e.g. 'CAD-7821'
  displayName: string;
  avatarEmoji: string;
  roleTitle: string; // e.g. 'Founder, Dhiti' or 'Student'
  streak: number;
  weeklyMinutes: number;
  weeklyHabits: number;
  lastActiveText: string;
  isCurrentUser?: boolean;
  cheersReceived: number;
}

export interface FriendQuest {
  id: string;
  title: string;
  description: string;
  partnerName: string;
  partnerAvatar: string;
  targetMetric: 'minutes' | 'habits';
  currentProgress: number;
  targetGoal: number;
  daysLeft: number;
  rewardXP: number;
  isCompleted: boolean;
}

export interface CheerActivity {
  id: string;
  senderName: string;
  senderAvatar: string;
  recipientName: string;
  type: 'high_five' | 'streak_fire' | 'nudge';
  message: string;
  timestamp: number;
}

