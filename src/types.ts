export interface WaterLogEntry {
  id: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  amount: number; // in ml, e.g. 100
  type: 'yes_100' | 'snooze_logged' | 'quick_log' | 'custom';
  totalDailySoFar: number;
  dailyGoal: number;
  syncedToSheet: boolean;
  note?: string;
}

export interface HydrationSettings {
  dailyGoalMl: number;
  reminderIntervalMinutes: number;
  characterSpeed: 'slow' | 'normal' | 'fast';
  soundEnabled: boolean;
  characterName: string;
  characterOutfit: 'classic' | 'pastel' | 'raincoat' | 'sailor' | 'sakura';
  characterAccessory: 'none' | 'water_bottle' | 'cat_ears' | 'flower_clip' | 'straw_hat';
  walkingArea: 'bottom_screen' | 'taskbar' | 'free_roam';
  autoSnoozeMinutes: number;
  desktopWallpaper: 'windows11_bloom' | 'cozy_room' | 'lofi_desk' | 'pastel_sky' | 'minimal_dark';
}

export type CharacterAction = 'walking' | 'idle' | 'reminding' | 'drinking' | 'snoozed' | 'cheering';

export interface CharacterState {
  action: CharacterAction;
  direction: 'left' | 'right';
  xPercent: number; // 0% to 100% horizontal position
  yPx: number; // offset from bottom
  isWalking: boolean;
  reminderActive: boolean;
  lastReminderTimestamp: number;
  nextReminderTimestamp: number;
  snoozeCount: number;
}

export interface GoogleAuthState {
  accessToken: string | null;
  expiresAt: number | null;
  userEmail: string | null;
  userName: string | null;
  userPicture: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  isConnecting: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage: string | null;
}

export interface DailySummary {
  date: string;
  totalMl: number;
  goalMl: number;
  entriesCount: number;
  achievedGoal: boolean;
}
