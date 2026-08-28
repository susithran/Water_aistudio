/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  WaterLogEntry,
  HydrationSettings,
  CharacterState,
  GoogleAuthState,
  CharacterAction,
} from './types';
import { soundManager } from './utils/audio';
import {
  fetchUserInfo,
  findExistingSpreadsheet,
  createHydrationSpreadsheet,
  appendWaterLogsToSheet,
} from './services/googleSheets';
import { WalkingCharacter } from './components/WalkingCharacter';
import { Dashboard } from './components/Dashboard';
import { WindowsDesktop } from './components/WindowsDesktop';
import { SettingsModal } from './components/SettingsModal';

// Initial default settings
const DEFAULT_SETTINGS: HydrationSettings = {
  dailyGoalMl: 2000,
  reminderIntervalMinutes: 30,
  characterSpeed: 'normal',
  soundEnabled: true,
  characterName: 'Aqua Lily',
  characterOutfit: 'classic',
  characterAccessory: 'cat_ears',
  walkingArea: 'bottom_screen',
  autoSnoozeMinutes: 10,
  desktopWallpaper: 'windows11_bloom',
};

// Initial character state
const INITIAL_CHARACTER_STATE: CharacterState = {
  action: 'walking',
  direction: 'right',
  xPercent: 15,
  yPx: 10,
  isWalking: true,
  reminderActive: false,
  lastReminderTimestamp: Date.now(),
  nextReminderTimestamp: Date.now() + 30 * 60 * 1000, // 30 mins from now
  snoozeCount: 0,
};

export default function App() {
  // Local storage loaded states
  const [settings, setSettings] = useState<HydrationSettings>(() => {
    try {
      const saved = localStorage.getItem('aqua_buddy_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [logs, setLogs] = useState<WaterLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('aqua_buddy_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Seed with a friendly start entry if empty
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    return [
      {
        id: 'seed-1',
        timestamp: Date.now() - 3600000 * 2,
        date: todayStr,
        time: timeStr,
        amount: 200,
        type: 'quick_log',
        totalDailySoFar: 200,
        dailyGoal: 2000,
        syncedToSheet: false,
        note: 'Morning Kickoff Glass',
      },
    ];
  });

  const [characterState, setCharacterState] = useState<CharacterState>(() => ({
    ...INITIAL_CHARACTER_STATE,
    nextReminderTimestamp: Date.now() + (settings.reminderIntervalMinutes || 30) * 60 * 1000,
  }));

  // Google Sheets OAuth state
  const [authState, setAuthState] = useState<GoogleAuthState>({
    accessToken: null,
    expiresAt: null,
    userEmail: null,
    userName: null,
    userPicture: null,
    spreadsheetId: null,
    spreadsheetUrl: null,
    isConnecting: false,
    isSyncing: false,
    lastSyncTime: null,
    syncStatus: 'idle',
    errorMessage: null,
  });

  // UI Window and View States
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(true);
  const [isDashboardMinimized, setIsDashboardMinimized] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'companion_only' | 'split'>('desktop');

  // Audio mute sync
  useEffect(() => {
    soundManager.setMuted(!settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('aqua_buddy_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage', e);
    }
  }, [settings]);

  // Persist logs
  useEffect(() => {
    try {
      localStorage.setItem('aqua_buddy_logs', JSON.stringify(logs));
    } catch (e) {
      console.warn('Could not save logs to localStorage', e);
    }
  }, [logs]);

  // Today's total intake
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter((l) => l.date === todayStr);
  const todayTotalMl = todayLogs.reduce((acc, curr) => acc + curr.amount, 0);

  // Character walking animation frame loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const updatePosition = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      setCharacterState((prev) => {
        // If character is reminding, drinking, or snoozed, pause walking movement
        if (prev.action !== 'walking' || prev.reminderActive) {
          return prev;
        }

        const speedFactor =
          settings.characterSpeed === 'slow' ? 3.5 : settings.characterSpeed === 'fast' ? 8.5 : 5.5;

        let nextX = prev.xPercent;
        let nextDir = prev.direction;

        if (prev.direction === 'right') {
          nextX += speedFactor * delta;
          if (nextX >= 90) {
            nextX = 90;
            nextDir = 'left';
          }
        } else {
          nextX -= speedFactor * delta;
          if (nextX <= 8) {
            nextX = 8;
            nextDir = 'right';
          }
        }

        return {
          ...prev,
          xPercent: nextX,
          direction: nextDir,
        };
      });

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(animationFrameId);
  }, [settings.characterSpeed]);

  // Timer check for periodic reminder
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCharacterState((prev) => {
        if (!prev.reminderActive && now >= prev.nextReminderTimestamp) {
          // Trigger reminder!
          if (settings.soundEnabled) {
            soundManager.playReminderChime();
          }
          return {
            ...prev,
            action: 'reminding',
            reminderActive: true,
            lastReminderTimestamp: now,
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.soundEnabled]);

  // Sync entries to Google Sheets helper
  const syncLogsToSheet = useCallback(
    async (entriesToSync: WaterLogEntry[], token: string, sheetId: string) => {
      if (!entriesToSync.length || !token || !sheetId) return;

      try {
        setAuthState((prev) => ({ ...prev, isSyncing: true, syncStatus: 'syncing' }));
        await appendWaterLogsToSheet(token, sheetId, entriesToSync);

        // Mark entries as synced
        const syncedIds = new Set(entriesToSync.map((e) => e.id));
        setLogs((prevLogs) =>
          prevLogs.map((l) => (syncedIds.has(l.id) ? { ...l, syncedToSheet: true } : l))
        );

        setAuthState((prev) => ({
          ...prev,
          isSyncing: false,
          syncStatus: 'success',
          lastSyncTime: Date.now(),
          errorMessage: null,
        }));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error syncing to Google Sheet';
        console.error('Error syncing logs to sheet:', err);
        setAuthState((prev) => ({
          ...prev,
          isSyncing: false,
          syncStatus: 'error',
          errorMessage: message,
        }));
      }
    },
    []
  );

  // Action: Add Water Log
  const handleAddWater = useCallback(
    (amount: number = 100, type: WaterLogEntry['type'] = 'yes_100', note?: string) => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0];
      const newTotal = todayTotalMl + amount;

      const newEntry: WaterLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: Date.now(),
        date: dateStr,
        time: timeStr,
        amount,
        type,
        totalDailySoFar: newTotal,
        dailyGoal: settings.dailyGoalMl,
        syncedToSheet: false,
        note: note || (type === 'yes_100' ? 'Drank water via reminder' : 'Manual drink log'),
      };

      setLogs((prev) => [newEntry, ...prev]);

      // Sound & animations
      if (settings.soundEnabled) {
        soundManager.playWaterDrop();
      }

      // Check if reached daily goal
      if (todayTotalMl < settings.dailyGoalMl && newTotal >= settings.dailyGoalMl) {
        // Fanfare & celebration!
        if (settings.soundEnabled) {
          setTimeout(() => soundManager.playSuccessFanfare(), 300);
        }
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#0284c7', '#f43f5e', '#fbbf24'],
        });
        setCharacterState((prev) => ({
          ...prev,
          action: 'cheering',
          reminderActive: false,
          nextReminderTimestamp: Date.now() + settings.reminderIntervalMinutes * 60 * 1000,
        }));
        setTimeout(() => {
          setCharacterState((prev) => ({ ...prev, action: 'walking' }));
        }, 3500);
      } else {
        // Normal drinking state
        setCharacterState((prev) => ({
          ...prev,
          action: 'drinking',
          reminderActive: false,
          nextReminderTimestamp: Date.now() + settings.reminderIntervalMinutes * 60 * 1000,
        }));
        setTimeout(() => {
          setCharacterState((prev) => ({ ...prev, action: 'walking' }));
        }, 2200);
      }

      // If Google Sheet is connected, sync immediately
      if (authState.accessToken && authState.spreadsheetId) {
        syncLogsToSheet([newEntry], authState.accessToken, authState.spreadsheetId);
      }
    },
    [
      todayTotalMl,
      settings.dailyGoalMl,
      settings.reminderIntervalMinutes,
      settings.soundEnabled,
      authState.accessToken,
      authState.spreadsheetId,
      syncLogsToSheet,
    ]
  );

  // Action: Handle Snooze (Option 2: No, Snooze)
  const handleSnooze = useCallback(
    (minutes?: number) => {
      const snoozeMins = minutes || settings.autoSnoozeMinutes || 10;
      if (settings.soundEnabled) {
        soundManager.playSnoozeSound();
      }

      setCharacterState((prev) => ({
        ...prev,
        action: 'snoozed',
        reminderActive: false,
        snoozeCount: prev.snoozeCount + 1,
        nextReminderTimestamp: Date.now() + snoozeMins * 60 * 1000,
      }));

      // Return to walking after 2.5 seconds
      setTimeout(() => {
        setCharacterState((prev) => ({
          ...prev,
          action: 'walking',
        }));
      }, 2500);
    },
    [settings.autoSnoozeMinutes, settings.soundEnabled]
  );

  // Action: Dismiss Reminder
  const handleDismissReminder = () => {
    setCharacterState((prev) => ({
      ...prev,
      action: 'walking',
      reminderActive: false,
      nextReminderTimestamp: Date.now() + settings.reminderIntervalMinutes * 60 * 1000,
    }));
  };

  // Action: Trigger Test Reminder
  const handleTriggerTestReminder = () => {
    if (settings.soundEnabled) {
      soundManager.playReminderChime();
    }
    setCharacterState((prev) => ({
      ...prev,
      action: 'reminding',
      reminderActive: true,
      lastReminderTimestamp: Date.now(),
    }));
  };

  // Action: Delete Log
  const handleDeleteLog = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  // Action: Connect Google Sheets via OAuth
  const handleConnectGoogle = async () => {
    setAuthState((prev) => ({ ...prev, isConnecting: true, errorMessage: null }));

    try {
      if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
        throw new Error(
          'Google Identity Services script is loading. Please check your internet connection and try again.'
        );
      }

      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '331733064312-gen-lang-client.apps.googleusercontent.com',
        scope:
          'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setAuthState((prev) => ({
              ...prev,
              isConnecting: false,
              errorMessage: tokenResponse.error_description || tokenResponse.error,
            }));
            return;
          }

          const token = tokenResponse.access_token;
          const expiresIn = tokenResponse.expires_in || 3600;

          // Fetch user info
          const userInfo = await fetchUserInfo(token);

          // Find or create hydration spreadsheet
          let sheetId = await findExistingSpreadsheet(token);
          let sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : null;

          if (!sheetId) {
            const created = await createHydrationSpreadsheet(token);
            sheetId = created.id;
            sheetUrl = created.url;
          }

          setAuthState({
            accessToken: token,
            expiresAt: Date.now() + expiresIn * 1000,
            userEmail: userInfo?.email || null,
            userName: userInfo?.name || null,
            userPicture: userInfo?.picture || null,
            spreadsheetId: sheetId,
            spreadsheetUrl: sheetUrl,
            isConnecting: false,
            isSyncing: false,
            lastSyncTime: Date.now(),
            syncStatus: 'success',
            errorMessage: null,
          });

          // Sync any unsynced local logs to the sheet
          const unsynced = logs.filter((l) => !l.syncedToSheet);
          if (unsynced.length > 0 && sheetId) {
            syncLogsToSheet(unsynced, token, sheetId);
          }
        },
      });

      client.requestAccessToken();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initialize Google Sign-in';
      console.error('Google Sign-in error:', err);
      setAuthState((prev) => ({
        ...prev,
        isConnecting: false,
        errorMessage: message,
      }));
    }
  };

  // Action: Manual Full Sync
  const handleSyncGoogleSheets = () => {
    if (!authState.accessToken || !authState.spreadsheetId) {
      handleConnectGoogle();
      return;
    }
    syncLogsToSheet(logs, authState.accessToken, authState.spreadsheetId);
  };

  // Action: Disconnect Google
  const handleDisconnectGoogle = () => {
    setAuthState({
      accessToken: null,
      expiresAt: null,
      userEmail: null,
      userName: null,
      userPicture: null,
      spreadsheetId: null,
      spreadsheetUrl: null,
      isConnecting: false,
      isSyncing: false,
      lastSyncTime: null,
      syncStatus: 'idle',
      errorMessage: null,
    });
  };

  // Character Click Easter Egg (Waves & encourages drink)
  const handleCharacterClick = () => {
    if (!characterState.reminderActive) {
      handleTriggerTestReminder();
    }
  };

  return (
    <WindowsDesktop
      settings={settings}
      characterState={characterState}
      authState={authState}
      todayTotalMl={todayTotalMl}
      dailyGoalMl={settings.dailyGoalMl}
      isDashboardOpen={isDashboardOpen}
      isDashboardMinimized={isDashboardMinimized}
      viewMode={viewMode}
      onToggleDashboard={() => setIsDashboardOpen(!isDashboardOpen)}
      onMinimizeDashboard={() => setIsDashboardMinimized(!isDashboardMinimized)}
      onOpenSettings={() => setIsSettingsOpen(true)}
      onTriggerReminder={handleTriggerTestReminder}
      onToggleSound={() =>
        setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
      }
      onViewModeChange={setViewMode}
    >
      {/* Hydration Dashboard Window Content */}
      <Dashboard
        logs={logs}
        settings={settings}
        authState={authState}
        nextReminderTimestamp={characterState.nextReminderTimestamp}
        onAddWater={handleAddWater}
        onDeleteLog={handleDeleteLog}
        onConnectGoogle={handleConnectGoogle}
        onSyncGoogleSheets={handleSyncGoogleSheets}
        onDisconnectGoogle={handleDisconnectGoogle}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onTriggerTestReminder={handleTriggerTestReminder}
        onToggleSound={() =>
          setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
        }
      />

      {/* The Animated Cute Cartoon Girl Walking Character */}
      <WalkingCharacter
        characterState={characterState}
        settings={settings}
        onDrinkYes={(amount) => handleAddWater(amount || 100, 'yes_100', 'Option 1 (+100ml)')}
        onSnooze={handleSnooze}
        onCharacterClick={handleCharacterClick}
        onDismissReminder={handleDismissReminder}
      />

      {/* Settings Modal */}
      <SettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
      />
    </WindowsDesktop>
  );
}
