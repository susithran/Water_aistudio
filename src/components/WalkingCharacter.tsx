import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplet, Clock, Check, Sparkles, X, ChevronRight, Heart, Bell } from 'lucide-react';
import { CharacterState, HydrationSettings } from '../types';

interface WalkingCharacterProps {
  characterState: CharacterState;
  settings: HydrationSettings;
  onDrinkYes: (amount?: number) => void;
  onSnooze: (minutes?: number) => void;
  onCharacterClick?: () => void;
  onDismissReminder?: () => void;
}

export const WalkingCharacter: React.FC<WalkingCharacterProps> = ({
  characterState,
  settings,
  onDrinkYes,
  onSnooze,
  onCharacterClick,
  onDismissReminder,
}) => {
  const [customAmount, setCustomAmount] = useState<number>(100);
  const [showAmountSelector, setShowAmountSelector] = useState(false);
  const [snoozeMins, setSnoozeMins] = useState<number>(settings.autoSnoozeMinutes || 10);
  const [showSnoozeSelector, setShowSnoozeSelector] = useState(false);

  const isFlipped = characterState.direction === 'left';
  const { action, reminderActive } = characterState;

  // Outfit color schemes
  const outfitThemes = {
    classic: {
      dress: '#38bdf8', // Sky blue
      dressTrim: '#0284c7',
      hair: '#634832', // Warm Chestnut Brown
      ribbon: '#f43f5e', // Rose
      shoes: '#0369a1',
    },
    pastel: {
      dress: '#f472b6', // Pastel Pink
      dressTrim: '#db2777',
      hair: '#f59e0b', // Honey Blonde
      ribbon: '#a855f7', // Lilac
      shoes: '#e11d48',
    },
    raincoat: {
      dress: '#facc15', // Bright Yellow Raincoat
      dressTrim: '#ca8a04',
      hair: '#374151', // Dark Navy/Black
      ribbon: '#06b6d4', // Cyan
      shoes: '#0891b2',
    },
    sailor: {
      dress: '#1e3a8a', // Sailor Navy Blue
      dressTrim: '#ffffff',
      hair: '#b45309', // Auburn
      ribbon: '#ef4444', // Red tie
      shoes: '#1e293b',
    },
    sakura: {
      dress: '#fb7185', // Sakura Rose
      dressTrim: '#fff1f2',
      hair: '#581c87', // Soft Violet Dark
      ribbon: '#ec4899',
      shoes: '#be123c',
    },
  };

  const currentTheme = outfitThemes[settings.characterOutfit] || outfitThemes.classic;

  return (
    <div
      id="desktop-walking-character-container"
      className="absolute bottom-4 select-none pointer-events-auto transition-all duration-300 ease-out"
      style={{
        left: `${characterState.xPercent}%`,
        transform: 'translateX(-50%)',
        zIndex: 40,
      }}
    >
      {/* Speech Bubble Reminder Overlay */}
      <AnimatePresence>
        {reminderActive && (
          <motion.div
            id="water-reminder-speech-bubble"
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="absolute bottom-[115px] left-1/2 -translate-x-1/2 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-sky-400/40 ring-4 ring-sky-500/20"
          >
            {/* Cute Speech Bubble Tail */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-slate-900" />

            {/* Header with cute tag and dismiss */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 mb-2.5">
              <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                <span className="p-1 rounded-full bg-sky-500/20 animate-pulse">
                  <Droplet className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                </span>
                <span className="tracking-wide uppercase font-semibold text-[11px]">
                  {settings.characterName || 'Aqua Lily'}
                </span>
              </div>
              <button
                id="btn-dismiss-reminder"
                onClick={onDismissReminder}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
                title="Dismiss reminder"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Message prompt */}
            <div className="mb-3 text-center">
              <p className="text-sm font-semibold text-sky-100 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300 inline animate-bounce" />
                Time to hydrate! Drink a sip with me?
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Stay energized and keep your streak going!
              </p>
            </div>

            {/* Option 1: Yes, +100ml (User requested Option 1) */}
            <div className="space-y-2">
              <div className="flex items-stretch gap-1.5">
                <button
                  id="btn-reminder-option-1-yes"
                  onClick={() => onDrinkYes(customAmount)}
                  className="flex-1 group relative overflow-hidden bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-2.5 px-3 rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 text-xs sm:text-sm"
                >
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                    1
                  </span>
                  <Droplet className="w-4 h-4 text-white fill-white group-hover:scale-110 transition-transform" />
                  <span>Yes, +{customAmount}ml</span>
                  <Check className="w-4 h-4 ml-auto opacity-80" />
                </button>

                {/* Amount quick picker toggle */}
                <button
                  id="btn-toggle-amount-selector"
                  onClick={() => setShowAmountSelector(!showAmountSelector)}
                  className={`px-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-colors ${
                    showAmountSelector
                      ? 'bg-sky-500/30 border-sky-400 text-sky-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Choose water amount"
                >
                  +{customAmount}
                </button>
              </div>

              {/* Expandable amount options */}
              <AnimatePresence>
                {showAmountSelector && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-slate-800/80 rounded-xl p-1.5 flex items-center justify-around gap-1 border border-slate-700/80"
                  >
                    {[50, 100, 150, 200, 250, 300].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => {
                          setCustomAmount(amt);
                          setShowAmountSelector(false);
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                          customAmount === amt
                            ? 'bg-sky-500 text-white font-bold'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {amt}ml
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Option 2: No, Snooze (User requested Option 2) */}
              <div className="flex items-stretch gap-1.5">
                <button
                  id="btn-reminder-option-2-snooze"
                  onClick={() => onSnooze(snoozeMins)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700/90 text-slate-200 hover:text-white font-semibold py-2 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all transform active:scale-95 text-xs sm:text-sm"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-black">
                    2
                  </span>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>No, Snooze ({snoozeMins}m)</span>
                </button>

                {/* Snooze time picker toggle */}
                <button
                  id="btn-toggle-snooze-selector"
                  onClick={() => setShowSnoozeSelector(!showSnoozeSelector)}
                  className={`px-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-colors ${
                    showSnoozeSelector
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                  title="Choose snooze duration"
                >
                  {snoozeMins}m
                </button>
              </div>

              {/* Expandable snooze durations */}
              <AnimatePresence>
                {showSnoozeSelector && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-slate-800/80 rounded-xl p-1.5 flex items-center justify-around gap-1 border border-slate-700/80"
                  >
                    {[5, 10, 15, 20, 30, 45].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => {
                          setSnoozeMins(mins);
                          setShowSnoozeSelector(false);
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                          snoozeMins === mins
                            ? 'bg-amber-500 text-slate-900 font-bold'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cute Reaction Floating Badges */}
      <AnimatePresence>
        {action === 'drinking' && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -25, scale: 1.1 }}
            exit={{ opacity: 0, y: -45, scale: 0.9 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-500 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 z-30"
          >
            <Sparkles className="w-3 h-3 text-amber-200" />
            +100ml Logged! Yummy!
          </motion.div>
        )}

        {action === 'snoozed' && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -35 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500/90 text-slate-900 font-bold text-xs px-2 py-0.5 rounded-full shadow flex items-center gap-1 z-30"
          >
            <Clock className="w-3 h-3" />
            Snoozed {snoozeMins}m! Zzz...
          </motion.div>
        )}

        {action === 'cheering' && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -30, scale: 1.2 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-xl flex items-center gap-1.5 z-30"
          >
            <Heart className="w-3.5 h-3.5 fill-white text-white animate-ping" />
            Daily Goal Reached! 🎉
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Animated Cute Cartoon Girl SVG Character */}
      <div
        id="cartoon-girl-character"
        onClick={onCharacterClick}
        className="relative cursor-pointer group flex flex-col items-center justify-end"
        title="Click to interact with your water companion!"
      >
        {/* Soft ground shadow */}
        <div className="w-16 h-3 bg-black/30 rounded-full blur-[2px] mb-[-4px] scale-x-110 group-hover:scale-x-125 transition-transform" />

        {/* Character Container with Flip & Bobbing Physics */}
        <motion.div
          animate={
            action === 'walking'
              ? { y: [0, -6, 0], rotate: isFlipped ? [0, -2, 0, 2, 0] : [0, 2, 0, -2, 0] }
              : action === 'drinking'
              ? { y: [0, -3, 0], rotate: [0, 4, 0] }
              : action === 'cheering'
              ? { y: [0, -18, 0, -10, 0], scale: [1, 1.08, 1] }
              : action === 'snoozed'
              ? { y: [0, 2, 0] }
              : { y: [0, -2, 0] } // idle breathing
          }
          transition={{
            repeat: Infinity,
            duration: action === 'walking' ? 0.45 : action === 'cheering' ? 0.7 : 1.8,
            ease: 'easeInOut',
          }}
          className={`w-24 h-28 relative flex items-center justify-center transition-transform duration-200 ${
            isFlipped ? '-scale-x-100' : 'scale-x-100'
          }`}
        >
          <svg
            viewBox="0 0 100 120"
            className="w-full h-full drop-shadow-md overflow-visible"
          >
            <defs>
              <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff1e6" />
                <stop offset="100%" stopColor="#fed7aa" />
              </linearGradient>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>

            {/* Back Ponytails / Hair */}
            <path
              d="M 28 35 C 10 38 12 60 22 68 C 26 72 32 60 30 50 Z"
              fill={currentTheme.hair}
            />
            <path
              d="M 72 35 C 90 38 88 60 78 68 C 74 72 68 60 70 50 Z"
              fill={currentTheme.hair}
            />

            {/* Hair Ribbons */}
            <circle cx="28" cy="38" r="4.5" fill={currentTheme.ribbon} />
            <circle cx="72" cy="38" r="4.5" fill={currentTheme.ribbon} />

            {/* Legs & Animated Walking Feet */}
            <g id="character-legs">
              {/* Left Leg */}
              <motion.g
                animate={
                  action === 'walking'
                    ? { rotate: [18, -18, 18], originY: 0.2 }
                    : action === 'cheering'
                    ? { rotate: [0, -10, 0] }
                    : { rotate: 0 }
                }
                transition={{ repeat: Infinity, duration: 0.45, ease: 'linear' }}
              >
                <rect x="40" y="85" width="7" height="20" rx="3.5" fill="#fed7aa" />
                {/* Left Shoe */}
                <ellipse cx="43.5" cy="105" rx="5.5" ry="4" fill={currentTheme.shoes} />
                <ellipse cx="43.5" cy="103" rx="4" ry="2" fill="#ffffff" opacity="0.6" />
              </motion.g>

              {/* Right Leg */}
              <motion.g
                animate={
                  action === 'walking'
                    ? { rotate: [-18, 18, -18], originY: 0.2 }
                    : action === 'cheering'
                    ? { rotate: [0, 10, 0] }
                    : { rotate: 0 }
                }
                transition={{ repeat: Infinity, duration: 0.45, ease: 'linear' }}
              >
                <rect x="53" y="85" width="7" height="20" rx="3.5" fill="#fed7aa" />
                {/* Right Shoe */}
                <ellipse cx="56.5" cy="105" rx="5.5" ry="4" fill={currentTheme.shoes} />
                <ellipse cx="56.5" cy="103" rx="4" ry="2" fill="#ffffff" opacity="0.6" />
              </motion.g>
            </g>

            {/* Dress Body */}
            <path
              d="M 38 60 Q 50 58 62 60 L 70 86 Q 50 90 30 86 Z"
              fill={currentTheme.dress}
            />
            {/* Dress Trim/Hem */}
            <path
              d="M 30 86 Q 50 90 70 86 Q 60 90 50 90 Q 40 90 30 86 Z"
              fill={currentTheme.dressTrim}
            />
            {/* Collar */}
            <path
              d="M 44 59 Q 50 64 56 59 Q 53 62 50 62 Q 47 62 44 59 Z"
              fill="#ffffff"
            />
            {/* Center Bow / Button */}
            <circle cx="50" cy="65" r="2.5" fill={currentTheme.ribbon} />

            {/* Neck */}
            <rect x="47" y="52" width="6" height="8" rx="2" fill="url(#skinGrad)" />

            {/* Head */}
            <ellipse cx="50" cy="38" rx="22" ry="20" fill="url(#skinGrad)" />

            {/* Rosy Cheeks */}
            <ellipse cx="36" cy="42" rx="4" ry="2.5" fill="#fb7185" opacity="0.6" />
            <ellipse cx="64" cy="42" rx="4" ry="2.5" fill="#fb7185" opacity="0.6" />

            {/* Eyes */}
            {action === 'drinking' || action === 'cheering' ? (
              // Happy squinting smiling eyes ^_^
              <g stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none">
                <path d="M 37 38 Q 42 33 46 38" />
                <path d="M 54 38 Q 58 33 63 38" />
              </g>
            ) : action === 'snoozed' ? (
              // Sleeping closed eyes -_-
              <g stroke="#334155" strokeWidth="2.2" strokeLinecap="round" fill="none">
                <path d="M 37 38 Q 42 41 46 38" />
                <path d="M 54 38 Q 58 41 63 38" />
              </g>
            ) : (
              // Big shiny anime/cartoon eyes
              <g id="eyes">
                {/* Left eye */}
                <ellipse cx="41" cy="37" rx="4.5" ry="6" fill="#1e293b" />
                <ellipse cx="42.5" cy="35" rx="2" ry="2.5" fill="#ffffff" />
                <circle cx="39.5" cy="39" r="1" fill="#ffffff" />

                {/* Right eye */}
                <ellipse cx="59" cy="37" rx="4.5" ry="6" fill="#1e293b" />
                <ellipse cx="60.5" cy="35" rx="2" ry="2.5" fill="#ffffff" />
                <circle cx="57.5" cy="39" r="1" fill="#ffffff" />
              </g>
            )}

            {/* Mouth */}
            {action === 'drinking' ? (
              <ellipse cx="50" cy="46" rx="2" ry="2.5" fill="#e11d48" />
            ) : action === 'cheering' || action === 'reminding' ? (
              <path
                d="M 46 44 Q 50 49 54 44 Z"
                fill="#e11d48"
              />
            ) : (
              <path
                d="M 47 44 Q 50 47 53 44"
                stroke="#475569"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            )}

            {/* Cute Front Hair Bangs */}
            <path
              d="M 28 32 C 32 20 68 20 72 32 C 65 24 55 24 50 30 C 45 24 35 24 28 32 Z"
              fill={currentTheme.hair}
            />
            <path
              d="M 32 30 C 37 36 43 36 46 32 C 43 28 38 27 32 30 Z"
              fill={currentTheme.hair}
            />
            <path
              d="M 68 30 C 63 36 57 36 54 32 C 57 28 62 27 68 30 Z"
              fill={currentTheme.hair}
            />

            {/* Cute Accessory (Cat Ears / Flower / Water Bottle) */}
            {settings.characterAccessory === 'cat_ears' && (
              <g id="cat-ears">
                <polygon points="32,24 38,12 45,22" fill={currentTheme.ribbon} />
                <polygon points="35,22 38,15 42,21" fill="#fecdd3" />
                <polygon points="68,24 62,12 55,22" fill={currentTheme.ribbon} />
                <polygon points="65,22 62,15 58,21" fill="#fecdd3" />
              </g>
            )}

            {settings.characterAccessory === 'flower_clip' && (
              <g id="flower-clip" transform="translate(62, 22)">
                <circle cx="0" cy="0" r="4" fill="#f43f5e" />
                <circle cx="0" cy="0" r="1.5" fill="#fef08a" />
              </g>
            )}

            {/* Arms & Hands (Holding Water Bottle or Waving) */}
            {action === 'reminding' ? (
              // Both arms holding a water cup up offering a drink!
              <g id="arms-offering-water">
                <path
                  d="M 35 65 Q 42 66 45 68"
                  stroke="#fed7aa"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 65 65 Q 58 66 55 68"
                  stroke="#fed7aa"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Cute Water Bottle with straw & water */}
                <g transform="translate(43, 60)">
                  <rect x="0" y="4" width="14" height="18" rx="3" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" />
                  <rect x="1" y="10" width="12" height="11" rx="2" fill="url(#waterGrad)" />
                  {/* Straw */}
                  <line x1="7" y1="-2" x2="11" y2="4" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                  {/* Water drop icon on bottle */}
                  <circle cx="7" cy="15" r="2" fill="#ffffff" opacity="0.8" />
                </g>
              </g>
            ) : action === 'drinking' ? (
              // Holding bottle to mouth
              <g id="arms-drinking">
                <path
                  d="M 36 65 Q 46 54 48 48"
                  stroke="#fed7aa"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
                <g transform="translate(44, 42)">
                  <rect x="0" y="4" width="12" height="16" rx="2.5" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" />
                  <rect x="1" y="9" width="10" height="10" rx="1.5" fill="url(#waterGrad)" />
                  {/* Little sparkles */}
                  <circle cx="-3" cy="2" r="1.5" fill="#38bdf8" />
                  <circle cx="15" cy="5" r="1.5" fill="#38bdf8" />
                </g>
              </g>
            ) : (
              // Normal walking / idle arm swing
              <g id="arms-normal">
                {/* Left arm */}
                <motion.g
                  animate={
                    action === 'walking'
                      ? { rotate: [-20, 20, -20], originY: 0.1, originX: 0.2 }
                      : { rotate: [0, 4, 0] }
                  }
                  transition={{ repeat: Infinity, duration: 0.45, ease: 'linear' }}
                >
                  <path
                    d="M 35 63 Q 28 72 26 80"
                    stroke="#fed7aa"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="26" cy="80" r="3.5" fill="#fed7aa" />
                </motion.g>

                {/* Right arm (holding small cute water tumbler) */}
                <motion.g
                  animate={
                    action === 'walking'
                      ? { rotate: [20, -20, 20], originY: 0.1, originX: 0.8 }
                      : { rotate: [0, -4, 0] }
                  }
                  transition={{ repeat: Infinity, duration: 0.45, ease: 'linear' }}
                >
                  <path
                    d="M 65 63 Q 72 72 74 80"
                    stroke="#fed7aa"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="74" cy="80" r="3.5" fill="#fed7aa" />
                  {/* Mini water drop held */}
                  <g transform="translate(73, 76) scale(0.65)">
                    <rect x="0" y="0" width="8" height="11" rx="2" fill="#38bdf8" />
                    <rect x="2" y="-2" width="4" height="2" rx="1" fill="#0284c7" />
                  </g>
                </motion.g>
              </g>
            )}
          </svg>
        </motion.div>

        {/* Character Name Tag / Status Pill */}
        <div className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-700/80 text-[10px] text-slate-300 font-medium tracking-tight shadow-md group-hover:border-sky-500/50 group-hover:text-sky-300 transition-colors">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              reminderActive
                ? 'bg-amber-400 animate-ping'
                : action === 'walking'
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-sky-400'
            }`}
          />
          <span>{settings.characterName || 'Lily'}</span>
        </div>
      </div>
    </div>
  );
};
