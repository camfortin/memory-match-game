import React, { useState, useRef } from 'react';
import { Users2, Users, GripVertical } from 'lucide-react';
import { Player } from '../types';
import { CARD_THEMES } from './Card';

interface PlayerSetupProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  numPairs: number;
  setNumPairs: (num: number) => void;
  isThreePlayers: boolean;
  onTogglePlayers: () => void;
  onStartGame: () => void;
  selectedTheme: keyof typeof CARD_THEMES;
  setSelectedTheme: (theme: keyof typeof CARD_THEMES) => void;
}

const PlayerSetup: React.FC<PlayerSetupProps> = ({
  players,
  setPlayers,
  numPairs,
  setNumPairs,
  isThreePlayers,
  onTogglePlayers,
  onStartGame,
  selectedTheme,
  setSelectedTheme,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const playerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleDragStart = (index: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setActiveIndex(index);
    setDragging(true);
  };

  const handleMove = (clientY: number) => {
    if (activeIndex === null || !dragging) return;

    const elements = playerRefs.current;
    
    elements.forEach((el, index) => {
      if (!el) return;
      
      const rect = el.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom && index !== activeIndex) {
        const newPlayers = [...players];
        const [movedPlayer] = newPlayers.splice(activeIndex, 1);
        newPlayers.splice(index, 0, movedPlayer);
        setPlayers(newPlayers);
        setActiveIndex(index);
      }
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientY);
  };

  const handleDragEnd = () => {
    setActiveIndex(null);
    setDragging(false);
  };

  // Set up mouse move and up listeners
  React.useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [dragging]);

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], name };
    setPlayers(newPlayers);
  };

  const themes = [
    { id: 'fantasy', name: 'Fantasy', emoji: '🏰' },
    { id: 'vehicles', name: 'Vehicles', emoji: '🚗' },
    { id: 'thanksgiving', name: 'Holiday', emoji: '🦃' },
    { id: 'sports', name: 'Sports', emoji: '⚽' }
  ] as const;

  const totalCards = numPairs * 2;
  const cardEmoji = CARD_THEMES[selectedTheme][0];

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="bg-white rounded-xl shadow-xl p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Memory Match Game
        </h1>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700">Players</h2>
            <button
              onClick={onTogglePlayers}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 hover:bg-purple-200 transition-colors"
            >
              {isThreePlayers ? <Users /> : <Users2 />}
              <span>{isThreePlayers ? '3 Players' : '2 Players'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={index}
                ref={el => playerRefs.current[index] = el}
                className={`flex items-center gap-4 bg-white rounded-lg p-2 transition-all ${
                  activeIndex === index ? 'opacity-50 scale-[1.02]' : ''
                }`}
              >
                <div 
                  className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none select-none"
                  onMouseDown={(e) => handleDragStart(index, e)}
                  onTouchStart={(e) => handleDragStart(index, e)}
                >
                  <GripVertical className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter player name"
                />
              </div>
            ))}
          </div>

          <button
            onClick={onStartGame}
            className="w-full py-3 px-6 text-white font-semibold bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition-opacity"
          >
            Let's Play!
          </button>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-purple-800 mb-3">Theme</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  title={theme.name}
                  className={`h-12 rounded-lg transition-all flex items-center justify-center gap-2 ${
                    selectedTheme === theme.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white hover:bg-purple-100'
                  }`}
                >
                  <span className="text-2xl">{theme.emoji}</span>
                  <span className="text-sm whitespace-nowrap">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-purple-800">
                Card Pairs: {numPairs}
              </h3>
              <input
                type="range"
                min="2"
                max="10"
                value={numPairs}
                onChange={(e) => setNumPairs(Number(e.target.value))}
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-sm font-medium text-purple-700">
                <span>2</span>
                <span>10</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-1 py-2">
              {Array.from({ length: totalCards }).map((_, i) => (
                <div
                  key={i}
                  className="w-7 h-7 bg-white/50 rounded flex items-center justify-center text-sm transform hover:scale-110 transition-transform"
                >
                  {cardEmoji}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerSetup;