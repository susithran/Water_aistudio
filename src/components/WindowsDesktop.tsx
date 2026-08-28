import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Droplet,
  FileSpreadsheet,
  Settings as SettingsIcon,
  Maximize2,
  Minimize2,
  X,
  Minus,
  Sparkles,
  Volume2,
  VolumeX,
  Bell,
  Wifi,
  Battery,
  Layers,
  Layout,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { HydrationSettings, CharacterState, GoogleAuthState, WaterLogEntry } from '../types';

interface WindowsDesktopProps {
  settings: HydrationSettings;
  characterState: CharacterState;
  authState: GoogleAuthState;
  todayTotalMl: number;
  dailyGoalMl: number;
  isDashboardOpen: boolean;
  isDashboardMinimized: boolean;
  viewMode: 'desktop' | 'companion_only' | 'split';
  children: React.ReactNode;
  onToggleDashboard: () => void;
  onMinimizeDashboard: () => void;
  onOpenSettings: () => void;
  onTriggerReminder: () => void;
  onToggleSound: () => void;
  onViewModeChange: (mode: 'desktop' | 'companion_only' | 'split') => void;
}

export const WindowsDesktop: React.FC<WindowsDesktopProps> = ({
  settings,
  characterState,
  authState,
  todayTotalMl,
  dailyGoalMl,
  isDashboardOpen,
  isDashboardMinimized,
  viewMode,
  children,
  onToggleDashboard,
  onMinimizeDashboard,
  onOpenSettings,
  onTriggerReminder,
  onToggleSound,
  onViewModeChange,
}) => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = currentTime.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });

  // Wallpaper backgrounds
  const wallpaperStyles = {
    windows11_bloom: 'bg-radial from-slate-900 via-sky-950 to-slate-950',
    cozy_room: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950/40',
    lofi_desk: 'bg-gradient-to-tr from-violet-950 via-slate-900 to-teal-950/40',
    pastel_sky: 'bg-gradient-to-b from-sky-900 via-indigo-900 to-slate-900',
    minimal_dark: 'bg-slate-950',
  };

  const currentWallpaper = wallpaperStyles[settings.desktopWallpaper] || wallpaperStyles.windows11_bloom;

  const pct = Math.min(100, Math.round((todayTotalMl / dailyGoalMl) * 100));

  return (
    <div
      id="windows-desktop-environment"
      className={`relative w-screen h-screen overflow-hidden flex flex-col justify-between ${currentWallpaper}`}
    >
      {/* Decorative desktop ambient light bloom */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-[100px]" />
      </div>

      {/* Top Desktop Controls Bar */}
      <header className="relative z-30 px-4 py-2 flex items-center justify-between text-xs text-slate-300 backdrop-blur-sm bg-black/10 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sky-300 font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span>Windows Desktop Companion</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/60 rounded-full px-3 py-0.5 text-[11px]">
            <Droplet className="w-3 h-3 text-sky-400 fill-sky-400" />
            <span>
              {todayTotalMl} / {dailyGoalMl} ml ({pct}%)
            </span>
          </div>

          {authState.accessToken && (
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 rounded-full px-2.5 py-0.5 text-[11px]">
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              <span>Synced with Google Sheet</span>
            </div>
          )}
        </div>

        {/* View Mode Switcher & Quick Controls */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-0.5 flex items-center">
            <button
              onClick={() => onViewModeChange('desktop')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                viewMode === 'desktop'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Window Mode"
            >
              Desktop Window
            </button>
            <button
              onClick={() => onViewModeChange('companion_only')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                viewMode === 'companion_only'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Clean screen with character walking freely"
            >
              Walking Pet Only
            </button>
          </div>

          <button
            onClick={onTriggerReminder}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
            title="Test reminder prompt"
          >
            <Sparkles className="w-3 h-3" />
            <span>Remind Me Now</span>
          </button>
        </div>
      </header>

      {/* Desktop Main Workspace Area */}
      <main className="relative flex-1 p-4 sm:p-6 flex items-center justify-center overflow-hidden z-20">
        {/* Desktop Icons (Left Side) */}
        {viewMode !== 'companion_only' && (
          <div className="hidden lg:flex flex-col gap-4 absolute top-8 left-6 z-10 select-none">
            <button
              onClick={() => {
                if (isDashboardMinimized) onMinimizeDashboard();
                else if (!isDashboardOpen) onToggleDashboard();
              }}
              className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-white/10 transition-colors w-24 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:scale-105 transition-transform">
                <Droplet className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-xs font-semibold text-white drop-shadow-md">
                Water Tracker
              </span>
            </button>

            {authState.spreadsheetUrl && (
              <a
                href={authState.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-white/10 transition-colors w-24 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-white drop-shadow-md">
                  Google Sheet
                </span>
              </a>
            )}

            <button
              onClick={onOpenSettings}
              className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-white/10 transition-colors w-24 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <SettingsIcon className="w-6 h-6 text-sky-400" />
              </div>
              <span className="text-xs font-semibold text-white drop-shadow-md">
                Settings
              </span>
            </button>
          </div>
        )}

        {/* Dashboard Window (Centered or Movable) */}
        <AnimatePresence>
          {isDashboardOpen && !isDashboardMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-4xl h-full max-h-[85vh] z-30 flex flex-col"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Windows 11 Style Bottom Taskbar */}
      <footer className="relative z-30 h-12 bg-slate-900/85 backdrop-blur-2xl border-t border-slate-700/60 px-3 flex items-center justify-between select-none">
        {/* Left: Windows Start & Widgets */}
        <div className="flex items-center gap-2">
          {/* Windows Start Button */}
          <button
            onClick={onToggleDashboard}
            className="p-2 rounded-lg hover:bg-white/10 active:bg-white/20 text-sky-400 transition-colors flex items-center justify-center"
            title="Start / Toggle Hydration Tracker"
          >
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <span className="bg-sky-400 rounded-sm" />
              <span className="bg-sky-400 rounded-sm" />
              <span className="bg-sky-400 rounded-sm" />
              <span className="bg-sky-400 rounded-sm" />
            </div>
          </button>

          {/* Active Application Button in Taskbar */}
          <button
            onClick={() => {
              if (isDashboardMinimized) onMinimizeDashboard();
              else onToggleDashboard();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              isDashboardOpen && !isDashboardMinimized
                ? 'bg-sky-500/20 border-sky-500/50 text-white'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Droplet className="w-4 h-4 text-sky-400 fill-sky-400" />
            <span className="text-xs font-semibold hidden sm:inline">
              Aqua Companion
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          </button>

          {authState.accessToken && authState.spreadsheetUrl && (
            <a
              href={authState.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-300 text-xs transition-colors"
              title="Open linked Google Sheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">Sheet</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}
        </div>

        {/* Center: Walking Character Taskbar Ground Indicator */}
        <div className="text-[11px] text-slate-400 hidden md:flex items-center gap-1.5">
          <span>Walking companion:</span>
          <span className="text-sky-300 font-semibold">{settings.characterName || 'Lily'}</span>
          <span className="text-slate-500">•</span>
          <span>Status:</span>
          <span className="text-emerald-400 capitalize font-medium">{characterState.action}</span>
        </div>

        {/* Right: System Tray & Clock */}
        <div className="flex items-center gap-2.5 text-slate-300">
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            title={settings.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>

          {/* Quick System Icons */}
          <div className="hidden sm:flex items-center gap-1.5 px-1.5 py-1 rounded-md hover:bg-white/10 transition-colors">
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-3.5 h-3.5" />
          </div>

          {/* Windows Clock & Date */}
          <div className="text-right px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer">
            <div className="text-[11px] font-semibold text-white leading-tight">
              {timeString}
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              {dateString}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
