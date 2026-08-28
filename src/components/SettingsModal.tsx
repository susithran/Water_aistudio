import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, User, Clock, Target, Sparkles, Volume2, Monitor, HelpCircle, Check, Palette } from 'lucide-react';
import { HydrationSettings } from '../types';

interface SettingsModalProps {
  settings: HydrationSettings;
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings: (newSettings: HydrationSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<HydrationSettings>(settings);
  const [activeTab, setActiveTab] = useState<'character' | 'goals' | 'desktop'>('character');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  const outfits = [
    { id: 'classic', label: 'Classic Sky Blue', color: 'bg-sky-400' },
    { id: 'pastel', label: 'Pastel Pink', color: 'bg-pink-400' },
    { id: 'raincoat', label: 'Raincoat Yellow', color: 'bg-amber-400' },
    { id: 'sailor', label: 'Sailor Navy', color: 'bg-blue-800' },
    { id: 'sakura', label: 'Sakura Blossom', color: 'bg-rose-400' },
  ];

  const accessories = [
    { id: 'none', label: 'None' },
    { id: 'cat_ears', label: 'Cat Ears 🐱' },
    { id: 'flower_clip', label: 'Flower Clip 🌸' },
  ];

  const wallpapers = [
    { id: 'windows11_bloom', label: 'Windows 11 Bloom Blue' },
    { id: 'cozy_room', label: 'Cozy Room' },
    { id: 'lofi_desk', label: 'Lo-Fi Workspace' },
    { id: 'pastel_sky', label: 'Pastel Sky' },
    { id: 'minimal_dark', label: 'Minimal Dark' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-800/80 px-5 py-3.5 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white">App & Companion Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-4 pt-2">
          <button
            onClick={() => setActiveTab('character')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'character'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Character Customizer
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'goals'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Goals & Timing
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'desktop'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Desktop & Sounds
          </button>
        </div>

        {/* Tab Content Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'character' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Companion Name
                </label>
                <input
                  type="text"
                  value={formData.characterName}
                  onChange={(e) => setFormData({ ...formData, characterName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  placeholder="e.g. Aqua Lily, Mimi, Chiyo"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-sky-400" />
                  Outfit & Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {outfits.map((outfit) => (
                    <button
                      key={outfit.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, characterOutfit: outfit.id as any })}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        formData.characterOutfit === outfit.id
                          ? 'border-sky-400 bg-sky-500/10 text-white font-bold'
                          : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${outfit.color}`} />
                      <span className="text-xs">{outfit.label}</span>
                      {formData.characterOutfit === outfit.id && (
                        <Check className="w-3.5 h-3.5 text-sky-400 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Cute Accessories
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {accessories.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, characterAccessory: acc.id as any })}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        formData.characterAccessory === acc.id
                          ? 'border-sky-400 bg-sky-500/10 text-white font-bold'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Walking Speed
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['slow', 'normal', 'fast'] as const).map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setFormData({ ...formData, characterSpeed: spd })}
                      className={`p-2 rounded-lg border capitalize text-center ${
                        formData.characterSpeed === spd
                          ? 'border-sky-400 bg-sky-500/10 text-white font-bold'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {spd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Daily Water Goal (ml)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="500"
                    max="6000"
                    step="100"
                    value={formData.dailyGoalMl}
                    onChange={(e) => setFormData({ ...formData, dailyGoalMl: Number(e.target.value) })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                  <span className="text-slate-400 font-semibold">ml / day</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[1500, 2000, 2500, 3000].map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setFormData({ ...formData, dailyGoalMl: goal })}
                      className="px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-[11px] text-slate-300"
                    >
                      {goal}ml
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Reminder Interval (Minutes)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={formData.reminderIntervalMinutes}
                    onChange={(e) => setFormData({ ...formData, reminderIntervalMinutes: Number(e.target.value) })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                  <span className="text-slate-400 font-semibold">mins</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[15, 30, 45, 60].map((int) => (
                    <button
                      key={int}
                      type="button"
                      onClick={() => setFormData({ ...formData, reminderIntervalMinutes: int })}
                      className="px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-[11px] text-slate-300"
                    >
                      {int} mins
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Default Snooze Duration (Minutes)
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setFormData({ ...formData, autoSnoozeMinutes: mins })}
                      className={`flex-1 py-1.5 rounded-lg border text-center ${
                        formData.autoSnoozeMinutes === mins
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Desktop Screen Wallpaper
                </label>
                <div className="space-y-1.5">
                  {wallpapers.map((wp) => (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, desktopWallpaper: wp.id as any })}
                      className={`w-full p-2 rounded-lg border text-left flex items-center justify-between ${
                        formData.desktopWallpaper === wp.id
                          ? 'border-sky-400 bg-sky-500/10 text-white font-bold'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <span>{wp.label}</span>
                      {formData.desktopWallpaper === wp.id && (
                        <Check className="w-3.5 h-3.5 text-sky-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <Volume2 className="w-4 h-4 text-sky-400" />
                    <span>Sound Effects & Gentle Chimes</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.soundEnabled}
                    onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-500 focus:ring-0 focus:outline-none"
                  />
                </label>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-300 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                  Windows Desktop Usage
                </div>
                <p>
                  This app is designed to run seamlessly as your daily desktop hydration companion. You can keep it open in a window on your secondary monitor or docked at the bottom of your screen!
                </p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold shadow-lg shadow-sky-500/25 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
