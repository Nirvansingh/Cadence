import type { 
  Habit, 
  HabitLog, 
  TimetableSlot, 
  NoteItem, 
  TaskItem, 
  UserProfile, 
  CadenceBackupData, 
  FocusLog,
  StreakState,
  FriendProfile,
  FriendQuest,
  CheerActivity
} from '../types';
import { getLocalDateString } from '../utils/dateUtils';

const STORAGE_KEYS = {
  ONBOARDING_DONE: 'cadence_onboarded_v1',
  PROFILE: 'cadence_profile_v1',
  HABITS: 'cadence_habits_v1',
  HABIT_LOGS: 'cadence_habit_logs_v1',
  TIMETABLE: 'cadence_timetable_v1',
  NOTES: 'cadence_notes_v1',
  TASKS: 'cadence_tasks_v1',
  FOCUS_LOGS: 'cadence_focus_logs_v1',
  STREAK: 'cadence_streak_v1',
  FRIENDS: 'cadence_friends_v1',
  QUESTS: 'cadence_friend_quests_v1',
  CHEERS: 'cadence_cheers_v1',
};

class LocalStorageAdapter {
  private changeListeners: (() => void)[] = [];

  subscribe(listener: () => void): () => void {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter(l => l !== listener);
    };
  }

  private notifyChange(): void {
    this.changeListeners.forEach(listener => {
      try {
        listener();
      } catch (err) {
        console.error('Storage change listener error:', err);
      }
    });
  }

  // Onboarding status
  isOnboardingCompleted(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE) === 'true';
  }

  setOnboardingCompleted(val: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, val ? 'true' : 'false');
  }

  // Profile
  getProfile(): UserProfile {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      const defaultProfile: UserProfile = {
        id: 'user_local',
        displayName: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        theme: 'oled-dark',
        soundEnabled: true,
        autoLockMinutes: 5,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      return defaultProfile;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {
        id: 'user_local',
        displayName: '',
        timezone: 'UTC',
        theme: 'oled-dark',
        soundEnabled: true,
        autoLockMinutes: 5,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }
  }

  setProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  // Habits (Start clean, zero fake demo data)
  getHabits(): Habit[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  setHabits(habits: Habit[]): void {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    this.notifyChange();
  }

  // Habit Logs
  getHabitLogs(): HabitLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HABIT_LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  setHabitLogs(logs: HabitLog[]): void {
    localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(logs));
    this.notifyChange();
  }

  toggleHabitLog(habitId: string, dateStr: string): boolean {
    const logs = this.getHabitLogs();
    const existingIndex = logs.findIndex(l => l.habitId === habitId && l.completedDate === dateStr);
    let isCompleted = false;

    if (existingIndex >= 0) {
      logs.splice(existingIndex, 1);
      isCompleted = false;
    } else {
      logs.push({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        habitId,
        completedDate: dateStr,
        completedAt: Date.now()
      });
      isCompleted = true;
      if (dateStr === getLocalDateString()) {
        this.recordStudyActivity(0, 1);
      }
    }
    this.setHabitLogs(logs);
    return isCompleted;
  }

  // Timetable
  getTimetable(): TimetableSlot[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  setTimetable(slots: TimetableSlot[]): void {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(slots));
    this.notifyChange();
  }

  // Tasks
  getTasks(): TaskItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  setTasks(tasks: TaskItem[]): void {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    this.notifyChange();
  }

  // Notes
  getNotes(): NoteItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  setNotes(notes: NoteItem[]): void {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    this.notifyChange();
  }

  // Focus Sessions
  getFocusLogs(): FocusLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FOCUS_LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  setFocusLogs(logs: FocusLog[]): void {
    localStorage.setItem(STORAGE_KEYS.FOCUS_LOGS, JSON.stringify(logs));
    this.notifyChange();
  }

  addFocusLog(minutes: number): FocusLog {
    const logs = this.getFocusLogs();
    const today = getLocalDateString();
    const newLog: FocusLog = {
      id: `fl_${Date.now()}`,
      dateStr: today,
      minutes,
      timestamp: Date.now()
    };
    const updated = [newLog, ...logs];
    this.setFocusLogs(updated);
    this.recordStudyActivity(minutes, 0);
    return newLog;
  }

  // Complete clean slate onboarding initialization
  initializeFromOnboarding(params: {
    displayName: string;
    wakeTime: string;
    sleepTime: string;
    primaryFocus: string;
    firstHabitTitle: string;
    firstHabitCue: string;
    firstHabitRoutine: string;
    firstHabitReward: string;
  }): void {
    // 1. Profile
    const profile = this.getProfile();
    profile.displayName = params.displayName;
    this.setProfile(profile);

    // 2. Initial real Schedule (Sleep & Wake blocks across Monday-Sunday)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
    const initialSlots: TimetableSlot[] = [];

    days.forEach((day, index) => {
      // Sleep block
      initialSlots.push({
        id: `slot_sleep_${day.toLowerCase()}`,
        dayOfWeek: day,
        startTime: params.sleepTime,
        endTime: params.wakeTime,
        title: 'Rest & Sleep',
        category: 'sleep',
        note: 'Restorative sleep',
        sortOrder: 1,
        createdAt: Date.now() + index,
        updatedAt: Date.now() + index
      });

      // Dedicated Focus block
      if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)) {
        initialSlots.push({
          id: `slot_focus_${day.toLowerCase()}`,
          dayOfWeek: day,
          startTime: '16:00',
          endTime: '18:00',
          title: `${params.primaryFocus} Study Block`,
          category: 'study',
          note: 'Deep focus time',
          sortOrder: 2,
          createdAt: Date.now() + index + 10,
          updatedAt: Date.now() + index + 10
        });
      }
    });
    this.setTimetable(initialSlots);

    // 3. First Habit Loop (User's real chosen routine)
    if (params.firstHabitTitle.trim()) {
      const firstHabit: Habit = {
        id: `h_anchor_${Date.now()}`,
        title: params.firstHabitTitle.trim(),
        category: 'study',
        timeOfDay: 'morning',
        cue: params.firstHabitCue.trim() || 'Morning trigger',
        routine: params.firstHabitRoutine.trim() || 'Execute micro-step',
        reward: params.firstHabitReward.trim() || 'Mental clarity',
        targetDaysMask: 127,
        sortOrder: 1,
        isArchived: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.setHabits([firstHabit]);
    }

    this.setOnboardingCompleted(true);
  }

  // Backup & Restore
  exportBackup(): string {
    const data: CadenceBackupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      habits: this.getHabits(),
      habitLogs: this.getHabitLogs(),
      timetable: this.getTimetable(),
      notes: this.getNotes(),
      tasks: this.getTasks(),
      focusLogs: this.getFocusLogs()
    };
    return JSON.stringify(data, null, 2);
  }

  importBackup(jsonString: string): boolean {
    try {
      const data: CadenceBackupData = JSON.parse(jsonString);
      if (data.profile) this.setProfile(data.profile);
      if (data.habits) this.setHabits(data.habits);
      if (data.habitLogs) this.setHabitLogs(data.habitLogs);
      if (data.timetable) this.setTimetable(data.timetable);
      if (data.notes) this.setNotes(data.notes);
      if (data.tasks) this.setTasks(data.tasks);
      if (data.focusLogs) this.setFocusLogs(data.focusLogs);
      this.setOnboardingCompleted(true);
      return true;
    } catch {
      return false;
    }
  }

  // ----------------------------------------------------
  // Streak System (Duolingo Style)
  // ----------------------------------------------------
  getStreakState(): StreakState {
    const raw = localStorage.getItem(STORAGE_KEYS.STREAK);
    const todayStr = getLocalDateString();

    const defaultState: StreakState = {
      currentStreak: 0,
      bestStreak: 0,
      lastActiveDate: '',
      freezesAvailable: 2,
      freezeDates: [],
      activeDates: []
    };

    if (!raw) {
      const hasHabitToday = this.getHabitLogs().some(l => l.completedDate === todayStr);
      const hasFocusToday = this.getFocusLogs().some(l => l.dateStr === todayStr);
      if (hasHabitToday || hasFocusToday) {
        defaultState.currentStreak = 1;
        defaultState.bestStreak = 1;
        defaultState.lastActiveDate = todayStr;
        defaultState.activeDates = [todayStr];
        this.setStreakState(defaultState);
      }
      return defaultState;
    }

    try {
      const state: StreakState = JSON.parse(raw);
      return this.evaluateStreakIntegrity(state);
    } catch {
      return defaultState;
    }
  }

  setStreakState(state: StreakState): void {
    localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(state));
    this.notifyChange();
  }

  private evaluateStreakIntegrity(state: StreakState): StreakState {
    const todayStr = getLocalDateString();
    if (!state.lastActiveDate || state.lastActiveDate === todayStr) {
      return state;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    if (state.lastActiveDate === yesterdayStr) {
      // Studied yesterday, haven't studied today yet. Streak is still active.
      return state;
    }

    // If last active was before yesterday, check Streak Freeze protection
    if (state.freezesAvailable > 0 && state.currentStreak > 0) {
      state.freezesAvailable -= 1;
      if (!state.freezeDates.includes(yesterdayStr)) {
        state.freezeDates.push(yesterdayStr);
      }
      state.lastActiveDate = yesterdayStr; // Freeze shielded the missed day
      this.setStreakState(state);
      return state;
    }

    // No freeze available: streak resets
    if (state.currentStreak > 0) {
      state.currentStreak = 0;
      this.setStreakState(state);
    }
    return state;
  }

  recordStudyActivity(minutes: number = 0, habitCount: number = 1): StreakState {
    const todayStr = getLocalDateString();
    const streak = this.getStreakState();

    if (streak.lastActiveDate !== todayStr) {
      streak.currentStreak += 1;
      if (streak.currentStreak > streak.bestStreak) {
        streak.bestStreak = streak.currentStreak;
      }
      streak.lastActiveDate = todayStr;
      if (!streak.activeDates.includes(todayStr)) {
        streak.activeDates.push(todayStr);
      }
      this.setStreakState(streak);
    }

    // Advance friend quests with logged progress
    this.advanceFriendQuests(minutes, habitCount);

    return streak;
  }

  refillStreakFreeze(): boolean {
    const streak = this.getStreakState();
    if (streak.freezesAvailable < 2) {
      streak.freezesAvailable += 1;
      this.setStreakState(streak);
      return true;
    }
    return false;
  }

  // ----------------------------------------------------
  // Friends & Social System (Duolingo Style)
  // ----------------------------------------------------
  getFriends(): FriendProfile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FRIENDS);
    const profile = this.getProfile();
    const streak = this.getStreakState();

    // Calculate this week's study statistics for the user
    const now = new Date();
    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday start
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyFocusMinutes = this.getFocusLogs()
      .filter(l => l.timestamp >= startOfWeek.getTime())
      .reduce((acc, curr) => acc + curr.minutes, 0);

    const weeklyHabitsCount = this.getHabitLogs()
      .filter(l => l.completedAt >= startOfWeek.getTime())
      .length;

    const userProfileEntry: FriendProfile = {
      id: profile.id || 'user_local',
      friendCode: (profile as any).friendCode || 'CAD-7821',
      displayName: profile.displayName || 'You',
      avatarEmoji: '⚡',
      roleTitle: 'Self-Directed Learner',
      streak: streak.currentStreak,
      weeklyMinutes: weeklyFocusMinutes,
      weeklyHabits: weeklyHabitsCount,
      lastActiveText: streak.lastActiveDate === getLocalDateString() ? 'Active today' : 'Active yesterday',
      isCurrentUser: true,
      cheersReceived: (profile as any).cheersReceived || 12
    };

    let friendsList: FriendProfile[] = [];
    if (raw) {
      try {
        friendsList = JSON.parse(raw);
      } catch {
        friendsList = [];
      }
    }

    if (friendsList.length === 0) {
      friendsList = [
        {
          id: 'friend_nirvan',
          friendCode: 'CAD-1024',
          displayName: 'Nirvan Singh',
          avatarEmoji: '⚡',
          roleTitle: 'Founder, Dhiti',
          streak: 18,
          weeklyMinutes: 420,
          weeklyHabits: 24,
          lastActiveText: 'Active 10m ago',
          cheersReceived: 46
        },
        {
          id: 'friend_shweta',
          friendCode: 'CAD-2048',
          displayName: 'Shweta Sucharia',
          avatarEmoji: '🌱',
          roleTitle: 'Co-Founder, LifeSecret',
          streak: 14,
          weeklyMinutes: 380,
          weeklyHabits: 22,
          lastActiveText: 'Active 45m ago',
          cheersReceived: 38
        },
        {
          id: 'friend_baljeet',
          friendCode: 'CAD-4096',
          displayName: 'Baljeet Singh',
          avatarEmoji: '🚀',
          roleTitle: 'Tech Strategist, LifeSecret',
          streak: 21,
          weeklyMinutes: 510,
          weeklyHabits: 29,
          lastActiveText: 'Active 2h ago',
          cheersReceived: 53
        }
      ];
      this.setFriends(friendsList);
    }

    return [userProfileEntry, ...friendsList.filter(f => !f.isCurrentUser)];
  }

  setFriends(friends: FriendProfile[]): void {
    const listToStore = friends.filter(f => !f.isCurrentUser);
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(listToStore));
    this.notifyChange();
  }

  addFriend(codeOrName: string): boolean {
    const clean = codeOrName.trim();
    if (!clean) return false;
    const friends = this.getFriends().filter(f => !f.isCurrentUser);

    if (friends.some(f => f.friendCode.toLowerCase() === clean.toLowerCase() || f.displayName.toLowerCase() === clean.toLowerCase())) {
      return false;
    }

    const newFriend: FriendProfile = {
      id: `friend_${Date.now()}`,
      friendCode: clean.startsWith('CAD-') ? clean.toUpperCase() : `CAD-${Math.floor(1000 + Math.random() * 9000)}`,
      displayName: clean.startsWith('CAD-') ? `Study Buddy (${clean.toUpperCase()})` : clean,
      avatarEmoji: ['🎓', '🎯', '📚', '🔥', '💡'][Math.floor(Math.random() * 5)],
      roleTitle: 'Study Partner',
      streak: Math.floor(1 + Math.random() * 10),
      weeklyMinutes: Math.floor(60 + Math.random() * 240),
      weeklyHabits: Math.floor(5 + Math.random() * 15),
      lastActiveText: 'Active today',
      cheersReceived: 0
    };

    friends.push(newFriend);
    this.setFriends(friends);
    return true;
  }

  // Quests
  getFriendQuests(): FriendQuest[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTS);
    if (!raw) {
      const defaultQuests: FriendQuest[] = [
        {
          id: 'quest_duo_minutes',
          title: 'Weekly Focus Sprint with Shweta',
          description: 'Log 500 total focus minutes together this week',
          partnerName: 'Shweta Sucharia',
          partnerAvatar: '🌱',
          targetMetric: 'minutes',
          currentProgress: 260,
          targetGoal: 500,
          daysLeft: 4,
          rewardXP: 150,
          isCompleted: false
        },
        {
          id: 'quest_habits_duo',
          title: 'Habit Consistency Challenge with Nirvan',
          description: 'Complete 30 total habits together this week',
          partnerName: 'Nirvan Singh',
          partnerAvatar: '⚡',
          targetMetric: 'habits',
          currentProgress: 21,
          targetGoal: 30,
          daysLeft: 4,
          rewardXP: 100,
          isCompleted: false
        }
      ];
      this.setFriendQuests(defaultQuests);
      return defaultQuests;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  setFriendQuests(quests: FriendQuest[]): void {
    localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(quests));
    this.notifyChange();
  }

  advanceFriendQuests(minutes: number, habits: number): void {
    const quests = this.getFriendQuests();
    let changed = false;

    quests.forEach(q => {
      if (q.isCompleted) return;
      if (q.targetMetric === 'minutes' && minutes > 0) {
        q.currentProgress = Math.min(q.targetGoal, q.currentProgress + minutes);
        if (q.currentProgress >= q.targetGoal) q.isCompleted = true;
        changed = true;
      } else if (q.targetMetric === 'habits' && habits > 0) {
        q.currentProgress = Math.min(q.targetGoal, q.currentProgress + habits);
        if (q.currentProgress >= q.targetGoal) q.isCompleted = true;
        changed = true;
      }
    });

    if (changed) {
      this.setFriendQuests(quests);
    }
  }

  // Cheers & Activity Feed
  getCheers(): CheerActivity[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHEERS);
    if (!raw) {
      const defaultCheers: CheerActivity[] = [
        {
          id: 'cheer_1',
          senderName: 'Nirvan Singh',
          senderAvatar: '⚡',
          recipientName: 'You',
          type: 'high_five',
          message: 'Sent you a high-five for starting strong this week! 🎉',
          timestamp: Date.now() - 3600000 * 2
        },
        {
          id: 'cheer_2',
          senderName: 'Baljeet Singh',
          senderAvatar: '🚀',
          recipientName: 'Shweta Sucharia',
          type: 'streak_fire',
          message: 'Congratulated Shweta on a 14-day study streak! 🔥',
          timestamp: Date.now() - 3600000 * 5
        }
      ];
      this.setCheers(defaultCheers);
      return defaultCheers;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  setCheers(cheers: CheerActivity[]): void {
    localStorage.setItem(STORAGE_KEYS.CHEERS, JSON.stringify(cheers.slice(0, 50)));
    this.notifyChange();
  }

  sendCheer(friendId: string, type: 'high_five' | 'streak_fire' | 'nudge'): boolean {
    const friends = this.getFriends();
    const target = friends.find(f => f.id === friendId);
    if (!target) return false;

    target.cheersReceived = (target.cheersReceived || 0) + 1;
    this.setFriends(friends);

    const cheers = this.getCheers();
    const profile = this.getProfile();
    const myName = profile.displayName || 'You';

    const msg = type === 'high_five' 
      ? `Sent a high-five to ${target.displayName}! 🎉` 
      : type === 'streak_fire' 
      ? `Sent fire encouragement to ${target.displayName}! 🔥` 
      : `Sent a friendly study reminder to ${target.displayName}! 🔔`;

    const newCheer: CheerActivity = {
      id: `c_${Date.now()}`,
      senderName: myName,
      senderAvatar: '⚡',
      recipientName: target.displayName,
      type,
      message: msg,
      timestamp: Date.now()
    };

    this.setCheers([newCheer, ...cheers]);
    return true;
  }
}

export const storage = new LocalStorageAdapter();
