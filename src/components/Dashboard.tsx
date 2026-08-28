import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Droplet,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Plus,
  Trash2,
  Settings,
  Sparkles,
  Calendar,
  Flame,
  CheckCircle2,
  AlertCircle,
  Clock,
  Volume2,
  VolumeX,
  Share2,
  Download,
  Info,
  Check,
  Table,
  UploadCloud,
  LogOut,
} from 'lucide-react';
import { WaterLogEntry, HydrationSettings, GoogleAuthState, DailySummary } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';
import { ConfirmModal } from './ConfirmModal';
import { fetchSheetLogs } from '../services/googleSheets';

interface DashboardProps {
  logs: WaterLogEntry[];
  settings: HydrationSettings;
  authState: GoogleAuthState;
  nextReminderTimestamp: number;
  onAddWater: (amount: number, type: WaterLogEntry['type'], note?: string) => void;
  onDeleteLog: (id: string) => void;
  onConnectGoogle: () => void;
  onSyncGoogleSheets: () => void;
  onDisconnectGoogle: () => void;
  onOpenSettings: () => void;
  onTriggerTestReminder: () => void;
  onToggleSound: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  logs,
  settings,
  authState,
  nextReminderTimestamp,
  onAddWater,
  onDeleteLog,
  onConnectGoogle,
  onSyncGoogleSheets,
  onDisconnectGoogle,
  onOpenSettings,
  onTriggerTestReminder,
  onToggleSound,
}) => {
  const [customAmountInput, setCustomAmountInput] = useState<string>('150');
  const [customNote, setCustomNote] = useState<string>('');
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'sheets'>('today');

  // Sheet remote data preview state
  const [remoteSheetRows, setRemoteSheetRows] = useState<string[][] | null>(null);
  const [isLoadingRemoteRows, setIsLoadingRemoteRows] = useState<boolean>(false);

  // Confirmation dialogs
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState<boolean>(false);

  // Today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter((l) => l.date === todayStr);
  const todayTotal = todayLogs.reduce((acc, curr) => acc + curr.amount, 0);
  const dailyGoal = settings.dailyGoalMl || 2000;
  const progressPercent = Math.min(100, Math.round((todayTotal / dailyGoal) * 100));
  const remainingMl = Math.max(0, dailyGoal - todayTotal);

  // Calculate 7-day history summaries
  const past7Days: DailySummary[] = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dStr = d.toISOString().split('T')[0];
    const dayEntries = logs.filter((l) => l.date === dStr);
    const sum = dayEntries.reduce((acc, l) => acc + l.amount, 0);
    return {
      date: dStr,
      totalMl: sum,
      goalMl: dailyGoal,
      entriesCount: dayEntries.length,
      achievedGoal: sum >= dailyGoal,
    };
  });

  // Calculate streak
  const streakDays = past7Days.filter((d) => d.achievedGoal).length;

  // Format time remaining for next reminder
  const now = Date.now();
  const msRemaining = Math.max(0, nextReminderTimestamp - now);
  const minsRemaining = Math.floor(msRemaining / 60000);
  const secsRemaining = Math.floor((msRemaining % 60000) / 1000);
  const reminderTimeDisplay = `${minsRemaining}m ${secsRemaining < 10 ? '0' : ''}${secsRemaining}s`;

  // Fetch remote sheet rows when sheets tab is opened
  useEffect(() => {
    if (activeTab === 'sheets' && authState.accessToken && authState.spreadsheetId) {
      loadRemoteSheetData();
    }
  }, [activeTab, authState.accessToken, authState.spreadsheetId]);

  const loadRemoteSheetData = async () => {
    if (!authState.accessToken || !authState.spreadsheetId) return;
    setIsLoadingRemoteRows(true);
    try {
      const rows = await fetchSheetLogs(authState.accessToken, authState.spreadsheetId);
      setRemoteSheetRows(rows);
    } catch (e) {
      console.error('Failed to load sheet rows:', e);
    } finally {
      setIsLoadingRemoteRows(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(customAmountInput, 10);
    if (!isNaN(amt) && amt > 0) {
      onAddWater(amt, 'custom', customNote || 'Custom intake');
      setCustomAmountInput('150');
      setCustomNote('');
      setShowCustomForm(false);
    }
  };

  const confirmDeleteAction = () => {
    if (confirmDeleteId) {
      onDeleteLog(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div
      id="hydration-dashboard-root"
      className="h-full flex flex-col bg-slate-900/90 text-slate-100 backdrop-blur-xl border border-slate-700/70 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Windows-like Header / Window Bar */}
      <div className="bg-slate-800/90 border-b border-slate-700/80 px-4 py-2.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/20">
            <Droplet className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
              Hydration Companion & Sheets Logger
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                v1.0 Windows
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Desktop Water Tracker with Interactive Walking Companion & Google Sheets
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <button
            id="btn-toggle-sound"
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg border transition-colors ${
              settings.soundEnabled
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 hover:bg-sky-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={settings.soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Test reminder button */}
          <button
            id="btn-test-reminder"
            onClick={onTriggerTestReminder}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all transform active:scale-95"
            title="Immediately trigger the cute walking character reminder"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Test Reminder</span>
          </button>

          {/* Settings modal trigger */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white border border-slate-600 transition-colors"
            title="Settings & Character Customization"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Dashboard Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
        {/* Top Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Daily Progress & Water Gauge Card */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/20 transition-all" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Today's Water Intake
              </span>
              <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                {progressPercent}% of Goal
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {todayTotal}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                / {dailyGoal} ml
              </span>
            </div>

            {/* Progress Bar with glowing aqua gradient */}
            <div className="w-full bg-slate-700/70 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-600/50 mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 shadow-sm shadow-cyan-400/50 relative"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </motion.div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{remainingMl > 0 ? `${remainingMl} ml left` : '🎉 Goal Achieved!'}</span>
              <span>{todayLogs.length} sips logged</span>
            </div>
          </div>

          {/* 2. Next Reminder Countdown & Status */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Next Walk Reminder
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <Clock className="w-3 h-3" />
                Every {settings.reminderIntervalMinutes}m
              </span>
            </div>

            <div className="my-1">
              <div className="text-2xl font-bold text-amber-200 font-mono flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
                {reminderTimeDisplay}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {settings.characterName || 'Lily'} will prompt you with Option 1 (+100ml) or Option 2 (Snooze).
              </p>
            </div>

            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">Companion Speed:</span>
              <span className="text-xs font-semibold text-sky-300 capitalize">
                {settings.characterSpeed}
              </span>
            </div>
          </div>

          {/* 3. Google Sheets Connection & Live Sync Card */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Google Sheets Sync
              </span>
              {authState.accessToken ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded-md">
                  Not Linked
                </span>
              )}
            </div>

            {authState.accessToken ? (
              <div className="space-y-2">
                <div className="text-xs text-slate-300 truncate">
                  <span className="text-slate-400">Account: </span>
                  <span className="font-medium text-white">{authState.userEmail || 'Google User'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {authState.spreadsheetUrl && (
                    <a
                      href={authState.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Sheet</span>
                    </a>
                  )}
                  <button
                    id="btn-manual-sync-sheets"
                    onClick={onSyncGoogleSheets}
                    disabled={authState.isSyncing}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 disabled:opacity-50"
                    title="Force sync all logs to sheet now"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${authState.isSyncing ? 'animate-spin text-sky-400' : ''}`} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-400 leading-snug">
                  Connect Google Sheets to automatically record each drink to your private spreadsheet.
                </p>
                <div>
                  <GoogleSignInButton
                    onClick={onConnectGoogle}
                    isLoading={authState.isConnecting}
                    className="w-full text-xs py-2"
                    label="Link Google Sheets"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                {authState.lastSyncTime
                  ? `Synced ${new Date(authState.lastSyncTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'Local cache active'}
              </span>
              {authState.accessToken && (
                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="text-rose-400 hover:underline text-[10px] flex items-center gap-0.5"
                >
                  <LogOut className="w-3 h-3" />
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Log Action Bar */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-sky-400 fill-sky-400" />
                Quick Intake Logger
              </h2>
              <p className="text-xs text-slate-400">
                Click any preset or enter custom amount to record intake & sync to Google Sheets
              </p>
            </div>

            <button
              id="btn-toggle-custom-log-form"
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showCustomForm ? 'Close Custom' : 'Custom Amount'}</span>
            </button>
          </div>

          {/* Quick Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              id="btn-quick-log-100"
              onClick={() => onAddWater(100, 'yes_100', 'Option 1 (+100ml)')}
              className="group relative bg-gradient-to-b from-sky-500/20 to-sky-600/30 hover:from-sky-500/30 hover:to-sky-600/40 border border-sky-500/40 hover:border-sky-400 text-sky-200 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">Option 1</span>
              <span className="text-base font-extrabold text-white flex items-center gap-1">
                <Droplet className="w-4 h-4 text-sky-400 fill-sky-400 group-hover:scale-110 transition-transform" />
                +100 ml
              </span>
              <span className="text-[10px] text-slate-400">Standard Glass</span>
            </button>

            <button
              id="btn-quick-log-200"
              onClick={() => onAddWater(200, 'quick_log', 'Small Cup (+200ml)')}
              className="group bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
            >
              <span className="text-[11px] font-semibold text-slate-400">Cup</span>
              <span className="text-base font-extrabold text-white flex items-center gap-1">
                <Droplet className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                +200 ml
              </span>
              <span className="text-[10px] text-slate-400">Coffee / Tea Cup</span>
            </button>

            <button
              id="btn-quick-log-250"
              onClick={() => onAddWater(250, 'quick_log', 'Large mug (+250ml)')}
              className="group bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
            >
              <span className="text-[11px] font-semibold text-slate-400">Mug</span>
              <span className="text-base font-extrabold text-white flex items-center gap-1">
                <Droplet className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                +250 ml
              </span>
              <span className="text-[10px] text-slate-400">Large Glass</span>
            </button>

            <button
              id="btn-quick-log-500"
              onClick={() => onAddWater(500, 'quick_log', 'Water bottle (+500ml)')}
              className="group bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
            >
              <span className="text-[11px] font-semibold text-slate-400">Bottle</span>
              <span className="text-base font-extrabold text-white flex items-center gap-1">
                <Droplet className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                +500 ml
              </span>
              <span className="text-[10px] text-slate-400">Hydration Flask</span>
            </button>
          </div>

          {/* Expandable Custom Intake Form */}
          {showCustomForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCustomSubmit}
              className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-2"
            >
              <div className="flex-1 min-w-[120px]">
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Amount (ml)
                </label>
                <input
                  id="input-custom-water-amount"
                  type="number"
                  min="10"
                  max="3000"
                  step="10"
                  value={customAmountInput}
                  onChange={(e) => setCustomAmountInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  placeholder="e.g. 350"
                  required
                />
              </div>

              <div className="flex-2 min-w-[180px]">
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Optional Note / Tag
                </label>
                <input
                  id="input-custom-water-note"
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  placeholder="e.g. Warm lemon tea, workout bottle..."
                />
              </div>

              <div className="self-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-lg shadow transition-colors"
                >
                  Log Custom
                </button>
              </div>
            </motion.form>
          )}
        </div>

        {/* Tabs for Today's Log Timeline vs 7-Day History vs Google Sheets info */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-700/80 mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('today')}
                className={`pb-2 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'today'
                    ? 'border-sky-400 text-sky-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Today's Timeline ({todayLogs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`pb-2 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'border-sky-400 text-sky-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>7-Day History & Streak</span>
              </button>

              <button
                onClick={() => setActiveTab('sheets')}
                className={`pb-2 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'sheets'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Google Sheets Live View</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Today's Timeline */}
          {activeTab === 'today' && (
            <div className="space-y-2">
              {todayLogs.length === 0 ? (
                <div className="bg-slate-800/30 border border-dashed border-slate-700/70 rounded-xl p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-2.5">
                    <Droplet className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-1">
                    No water logged yet today
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-3">
                    Your walking companion {settings.characterName || 'Lily'} will remind you periodically, or you can click any quick button above!
                  </p>
                  <button
                    onClick={() => onAddWater(100, 'yes_100', 'First sip of the day')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Drink +100ml Now
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
                  {todayLogs.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs">
                          #{todayLogs.length - index}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">
                              +{entry.amount} ml
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                              {entry.type === 'yes_100' ? 'Option 1 (+100ml)' : entry.type}
                            </span>
                            {entry.syncedToSheet ? (
                              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                Synced to Sheet
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Local log</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {entry.time} • Total so far: {entry.totalDailySoFar} ml {entry.note ? `• ${entry.note}` : ''}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setConfirmDeleteId(entry.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                        title="Delete this entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: 7-Day History */}
          {activeTab === 'history' && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">
                    7-Day Hydration Consistency ({streakDays}/7 Days Met Goal)
                  </span>
                </div>
                <span className="text-xs text-slate-400">Goal: {dailyGoal} ml/day</span>
              </div>

              {/* 7-Day Bar Chart */}
              <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4 border-b border-slate-700/60 pb-2">
                {past7Days.map((day) => {
                  const dayHeightPct = Math.min(100, Math.round((day.totalMl / (dailyGoal * 1.2)) * 100));
                  const isToday = day.date === todayStr;
                  const dateObj = new Date(day.date + 'T00:00:00');
                  const weekdayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {day.totalMl > 0 ? `${day.totalMl}` : '0'}
                      </span>
                      <div className="w-full max-w-[32px] bg-slate-700/60 rounded-t-md h-full flex items-end p-0.5">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(8, dayHeightPct)}%` }}
                          className={`w-full rounded-t-sm transition-colors ${
                            day.achievedGoal
                              ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                              : day.totalMl > 0
                              ? 'bg-gradient-to-t from-sky-600 to-cyan-400'
                              : 'bg-slate-600/40'
                          }`}
                        />
                      </div>
                      <span className={`text-[10px] font-semibold ${isToday ? 'text-sky-400 underline font-bold' : 'text-slate-400'}`}>
                        {weekdayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Google Sheets Details & Live Viewer */}
          {activeTab === 'sheets' && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Google Sheet Storage & Sync</h3>
                    <p className="text-xs text-slate-400">Spreadsheet: 💧 Water Hydration Log (Desktop Companion)</p>
                  </div>
                </div>

                {authState.accessToken && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadRemoteSheetData}
                      disabled={isLoadingRemoteRows}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-colors"
                      title="Refresh sheet data"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRemoteRows ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={onSyncGoogleSheets}
                      disabled={authState.isSyncing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <UploadCloud className={`w-3.5 h-3.5 ${authState.isSyncing ? 'animate-spin' : ''}`} />
                      <span>{authState.isSyncing ? 'Syncing...' : 'Sync All Logs'}</span>
                    </button>
                  </div>
                )}
              </div>

              {authState.accessToken ? (
                <div className="space-y-3">
                  <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Connection Status:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Live Synchronized with Google Account
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">User Account:</span>
                      <span className="text-white font-medium">{authState.userEmail || 'Connected Google Account'}</span>
                    </div>
                    {authState.spreadsheetId && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Spreadsheet ID:</span>
                        <span className="text-slate-300 font-mono text-[11px] truncate max-w-[220px]">
                          {authState.spreadsheetId}
                        </span>
                      </div>
                    )}
                    {authState.spreadsheetUrl && (
                      <div className="pt-2 flex items-center gap-2">
                        <a
                          href={authState.spreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Spreadsheet in Google Sheets
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Remote Sheet Data Table Preview */}
                  <div className="bg-slate-900/90 rounded-xl border border-slate-700/70 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Table className="w-3.5 h-3.5 text-sky-400" />
                        Live Rows Preview from Google Sheets
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {remoteSheetRows ? `${remoteSheetRows.length} rows recorded` : 'Loading rows...'}
                      </span>
                    </div>

                    {isLoadingRemoteRows ? (
                      <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                        <span>Loading Google Sheets entries...</span>
                      </div>
                    ) : remoteSheetRows && remoteSheetRows.length > 0 ? (
                      <div className="overflow-x-auto max-h-48 custom-scrollbar">
                        <table className="w-full text-[11px] text-left border-collapse">
                          <thead className="bg-slate-800 text-slate-300 uppercase tracking-wider text-[9px] sticky top-0">
                            <tr>
                              <th className="p-1.5 border-b border-slate-700">Timestamp</th>
                              <th className="p-1.5 border-b border-slate-700">Date</th>
                              <th className="p-1.5 border-b border-slate-700">Time</th>
                              <th className="p-1.5 border-b border-slate-700">Amount (ml)</th>
                              <th className="p-1.5 border-b border-slate-700">Total (ml)</th>
                              <th className="p-1.5 border-b border-slate-700">Goal %</th>
                              <th className="p-1.5 border-b border-slate-700">Type</th>
                              <th className="p-1.5 border-b border-slate-700">Note</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-200">
                            {remoteSheetRows.slice(-15).reverse().map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-800/50">
                                <td className="p-1.5 font-mono text-[10px] text-slate-400">{row[0] || '-'}</td>
                                <td className="p-1.5">{row[1] || '-'}</td>
                                <td className="p-1.5">{row[2] || '-'}</td>
                                <td className="p-1.5 font-bold text-sky-300">+{row[3]} ml</td>
                                <td className="p-1.5 text-slate-300">{row[4]} ml</td>
                                <td className="p-1.5 text-emerald-400 font-semibold">{row[6]}</td>
                                <td className="p-1.5 text-slate-400 text-[10px]">{row[7]}</td>
                                <td className="p-1.5 text-slate-400 text-[10px] truncate max-w-[120px]">{row[8]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No rows recorded yet in this spreadsheet. Log a drink or click "Sync All Logs" above!
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-900/60 rounded-xl border border-slate-700/60 p-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Connect Google Sheets to Enable Real-Time Cloud Logging
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                    With permission from your Google account, every water intake logged by you or your walking companion will be securely appended to your personal Google Sheet.
                  </p>
                  <div>
                    <GoogleSignInButton
                      onClick={onConnectGoogle}
                      isLoading={authState.isConnecting}
                      label="Sign in with Google & Link Sheet"
                    />
                  </div>
                </div>
              )}

              {/* Data Columns Explanation */}
              <div className="text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                  Spreadsheet Column Architecture:
                </div>
                <p className="font-mono text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-700/60">
                  Timestamp • Date • Time • Intake Amount (ml) • Daily Total (ml) • Daily Goal (ml) • Goal Progress (%) • Log Type • Character Note
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation modal for single entry deletion */}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Water Log Entry?"
        description="Are you sure you want to remove this water intake entry from your logs? This action cannot be undone."
        confirmLabel="Delete Entry"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Confirmation modal for disconnecting Google account */}
      <ConfirmModal
        isOpen={showDisconnectConfirm}
        title="Disconnect Google Sheets?"
        description="This will unlink your Google account from the desktop companion. Your existing Google Sheet in Google Drive will remain safe."
        confirmLabel="Disconnect"
        cancelLabel="Keep Connected"
        isDestructive={false}
        onConfirm={() => {
          onDisconnectGoogle();
          setShowDisconnectConfirm(false);
        }}
        onCancel={() => setShowDisconnectConfirm(false)}
      />
    </div>
  );
};
