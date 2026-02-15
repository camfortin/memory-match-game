import React from 'react';

export const CARD_THEMES = {
  olympics: ['🏅', '🏊', '🏋️', '🤸', '🚴', '🏇', '🤺', '🏌️', '🤾', '⛷️'],
  fantasy: ['🦄', '👸', '🏰', '🐉', '🧚', '🧙‍♂️', '🗡️', '👑', '🔮', '🧝‍♀️'],
  vehicles: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚛'],
  thanksgiving: ['🦃', '🥧', '🌽', '🥔', '🥖', '🍗', '🍽️', '🍁', '🎃', '👨‍👩‍👧‍👦'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎳', '🏓', '⛳']
};

const THEME_STYLES = {
  olympics: 'bg-gradient-to-br from-blue-600 via-yellow-400 to-red-500',
  fantasy: 'bg-gradient-to-br from-purple-500 to-pink-500',
  vehicles: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  thanksgiving: 'bg-gradient-to-br from-orange-500 to-amber-500',
  sports: 'bg-gradient-to-br from-green-500 to-emerald-500'
};

// Olympic ring symbol for card backs
const THEME_BACK_ICONS: Record<string, string> = {
  olympics: '🔵🟡⚫🟢🔴',
};

interface CardProps {
  id: number;
  imageIndex: number;
  isFlipped: boolean;
  isMatched: boolean;
  onClick: () => void;
  theme: keyof typeof CARD_THEMES;
}

const Card: React.FC<CardProps> = ({ imageIndex, isFlipped, isMatched, onClick, theme }) => {
  if (isMatched) {
    return <div className="w-full pt-[100%] bg-transparent" />;
  }

  const isOlympics = theme === 'olympics';

  return (
    <div
      onClick={onClick}
      className="aspect-square rounded-lg cursor-pointer perspective-1000"
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-gpu preserve-3d ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* Back of card */}
        <div
          className={`absolute inset-0 w-full h-full ${THEME_STYLES[theme]} rounded-lg backface-hidden shadow-lg flex items-center justify-center ${
            isOlympics ? 'border-2 border-white/30' : ''
          }`}
        >
          {isOlympics ? (
            <div className="text-center">
              <div className="text-xs leading-none tracking-tighter">🔵🟡⚫</div>
              <div className="text-xs leading-none tracking-tighter -mt-0.5">🟢🔴</div>
            </div>
          ) : (
            <div className="w-12 h-12 bg-white/20 rounded-full"></div>
          )}
        </div>

        {/* Front of card */}
        <div
          className={`absolute inset-0 w-full h-full bg-white rounded-lg [transform:rotateY(180deg)] backface-hidden shadow-lg flex items-center justify-center text-[8vh] ${
            isOlympics ? 'border-2 border-yellow-400' : ''
          }`}
        >
          <span className="transform [transform:rotateY(180deg)]">
            {CARD_THEMES[theme][imageIndex]}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Card;
