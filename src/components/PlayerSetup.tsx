import React, { useState, useRef } from 'react';
import { UserPlus, X, GripVertical, Monitor, User, Users } from 'lucide-react';
import { Player, GameMode, ComputerDifficulty } from '../types';
import { CARD_THEMES } from './Card';
import GameStats from './GameStats';

interface PlayerSetupProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  numPairs: number;
  setNumPairs: (num: number) => void;
  onStartGame: () => void;
  selectedTheme: keyof typeof CARD_THEMES;
  setSelectedTheme: (theme: keyof typeof CARD_THEMES) => void;
  gameMode: GameMode;
  onGameModeChange: (mode: GameMode) => void;
  computerDifficulty: ComputerDifficulty;
  setComputerDifficulty: (difficulty: ComputerDifficulty) => void;
}

const MAX_PLAYERS = 5;
const MIN_PLAYERS = 2;

const PlayerSetup: React.FC<PlayerSetupProps> = ({
  players,
  setPlayers,
  numPairs,
  setNumPairs,
  onStartGame,
  selectedTheme,
  setSelectedTheme,
  gameMode,
  onGameModeChange,
  computerDifficulty,
  setComputerDifficulty,
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

  const handleTouchMove = (e: TouchEvent) => {
    handleMove(e.touches[0].clientY);
  };

  const handleDragEnd = () => {
    setActiveIndex(null);
    setDragging(false);
  };

  React.useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove as EventListener);
      window.addEventListener('touchend', handleDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleTouchMove as EventListener);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [dragging]);

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], name };
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    if (players.length < MAX_PLAYERS) {
      setPlayers([...players, { name: '', score: 0, pairs: [] }]);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > MIN_PLAYERS) {
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
    }
  };

  const themes = [
    { id: 'olympics', name: 'Winter', emoji: '❄️' },
    { id: 'fantasy', name: 'Fantasy', emoji: '🏰' },
    { id: 'vehicles', name: 'Vehicles', emoji: '🚗' },
    { id: 'thanksgiving', name: 'Holiday', emoji: '🦃' },
    { id: 'sports', name: 'Sports', emoji: '⚽' },
    { id: 'easter', name: 'Easter', emoji: '🐰' }
  ] as const;

  const totalCards = numPairs * 2;
  const cardEmoji = CARD_THEMES[selectedTheme][0];

  const isOlympics = selectedTheme === 'olympics';

  // Olympic ring colors for player badges
  const olympicColors = [
    'bg-blue-500 text-white',
    'bg-yellow-400 text-gray-900',
    'bg-gray-800 text-white',
    'bg-green-500 text-white',
    'bg-red-500 text-white',
  ];

  const hasEmptyNames = players.some(p => p.name.trim() === '' && p.name !== 'Computer');

  const gameModes: { id: GameMode; label: string; icon: React.ReactNode }[] = [
    { id: 'multiplayer', label: 'Multiplayer', icon: <Users className="w-4 h-4" /> },
    { id: 'vs-computer', label: 'vs Computer', icon: <Monitor className="w-4 h-4" /> },
    { id: 'solo', label: 'Solo', icon: <User className="w-4 h-4" /> },
  ];

  const difficulties: { id: ComputerDifficulty; label: string; description: string }[] = [
    { id: 'easy', label: 'Easy', description: 'Forgetful' },
    { id: 'medium', label: 'Medium', description: 'Sometimes remembers' },
    { id: 'hard', label: 'Hard', description: 'Sharp memory' },
  ];

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl">
      <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* Olympic Header */}
        <div className="text-center space-y-1">
          <div className="flex justify-center gap-1 text-2xl">
            <span className="text-blue-500">&#9679;</span>
            <span className="text-yellow-400">&#9679;</span>
            <span className="text-gray-800">&#9679;</span>
            <span className="text-green-500">&#9679;</span>
            <span className="text-red-500">&#9679;</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-bold text-center ${
            isOlympics
              ? 'bg-gradient-to-r from-blue-600 via-yellow-500 to-red-500 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'
          }`}>
            Memory Match Games
          </h1>
          {isOlympics && (
            <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">
              Go for Gold!
            </p>
          )}
        </div>

        <div className="space-y-5 sm:space-y-6">
          {/* Game Mode Selector */}
          <div className={`p-3 sm:p-4 rounded-lg ${isOlympics ? 'bg-blue-50' : 'bg-purple-50'}`}>
            <h3 className={`text-lg font-bold mb-3 ${isOlympics ? 'text-blue-800' : 'text-purple-800'}`}>
              Game Mode
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {gameModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => onGameModeChange(mode.id)}
                  className={`h-12 rounded-lg transition-all flex items-center justify-center gap-1.5 active:scale-95 text-sm ${
                    gameMode === mode.id
                      ? isOlympics
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {mode.icon}
                  <span className="whitespace-nowrap">{mode.label}</span>
                </button>
              ))}
            </div>

            {/* Difficulty selector for vs-computer */}
            {gameMode === 'vs-computer' && (
              <div className="mt-3 space-y-2">
                <h4 className={`text-sm font-semibold ${isOlympics ? 'text-blue-700' : 'text-purple-700'}`}>
                  Difficulty
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {difficulties.map((diff) => (
                    <button
                      key={diff.id}
                      onClick={() => setComputerDifficulty(diff.id)}
                      className={`py-2 px-2 rounded-lg transition-all text-center active:scale-95 ${
                        computerDifficulty === diff.id
                          ? isOlympics
                            ? 'bg-blue-500 text-white shadow'
                            : 'bg-purple-500 text-white shadow'
                          : 'bg-white hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <div className="text-sm font-medium">{diff.label}</div>
                      <div className={`text-xs ${
                        computerDifficulty === diff.id ? 'text-white/80' : 'text-gray-400'
                      }`}>
                        {diff.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Solo mode description */}
            {gameMode === 'solo' && (
              <p className={`mt-3 text-sm ${isOlympics ? 'text-blue-600' : 'text-purple-600'}`}>
                Match all pairs on your own. See how few turns you can do it in!
              </p>
            )}
          </div>

          {/* Players Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-lg sm:text-xl font-semibold ${isOlympics ? 'text-blue-700' : 'text-gray-700'}`}>
                {gameMode === 'multiplayer' ? 'Competitors' : gameMode === 'vs-computer' ? 'Players' : 'Player'}
              </h2>
              {gameMode === 'multiplayer' && (
                <span className="text-sm text-gray-400">
                  {players.length}/{MAX_PLAYERS} players
                </span>
              )}
            </div>

            <div className="space-y-2">
              {players.map((player, index) => {
                const isComputer = player.name === 'Computer' && gameMode === 'vs-computer';
                return (
                  <div
                    key={index}
                    ref={el => playerRefs.current[index] = el}
                    className={`flex items-center gap-2 sm:gap-3 bg-gray-50 rounded-lg p-2 transition-all ${
                      activeIndex === index ? 'opacity-50 scale-[1.02]' : ''
                    }`}
                  >
                    {gameMode === 'multiplayer' && (
                      <div
                        className="flex items-center justify-center w-10 h-10 shrink-0 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none select-none"
                        onMouseDown={(e) => handleDragStart(index, e)}
                        onTouchStart={(e) => handleDragStart(index, e)}
                      >
                        <GripVertical className="w-5 h-5" />
                      </div>
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      isOlympics ? olympicColors[index % olympicColors.length] : 'bg-purple-100 text-purple-700'
                    }`}>
                      {isComputer ? (
                        <Monitor className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {isComputer ? (
                      <div className="flex-1 min-w-0 px-3 sm:px-4 py-2 text-gray-500 italic">
                        Computer ({computerDifficulty})
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => handleNameChange(index, e.target.value)}
                        className={`flex-1 min-w-0 px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent text-base bg-white text-gray-900 ${
                          isOlympics
                            ? 'border-blue-200 focus:ring-blue-400'
                            : 'border-gray-300 focus:ring-purple-500'
                        }`}
                        placeholder={`Player ${index + 1} name`}
                      />
                    )}
                    {gameMode === 'multiplayer' && players.length > MIN_PLAYERS && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="flex items-center justify-center w-10 h-10 shrink-0 text-gray-400 hover:text-red-500 active:text-red-600 transition-colors"
                        title="Remove player"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {gameMode === 'multiplayer' && players.length < MAX_PLAYERS && (
              <button
                onClick={addPlayer}
                className={`mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-colors ${
                  isOlympics
                    ? 'border-blue-300 text-blue-500 hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100'
                    : 'border-purple-300 text-purple-500 hover:bg-purple-50 hover:border-purple-400 active:bg-purple-100'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Player</span>
              </button>
            )}
          </div>

          {/* Start Game Button */}
          <button
            onClick={onStartGame}
            disabled={hasEmptyNames}
            className={`w-full py-3 px-6 text-white font-semibold rounded-lg transition-opacity text-lg ${
              hasEmptyNames
                ? 'opacity-50 cursor-not-allowed bg-gray-400'
                : isOlympics
                  ? 'bg-gradient-to-r from-blue-600 via-yellow-500 to-red-500 hover:opacity-90 active:opacity-80'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 active:opacity-80'
            }`}
          >
            {gameMode === 'solo'
              ? 'Start Training'
              : gameMode === 'vs-computer'
                ? 'Challenge Computer'
                : isOlympics ? 'Let the Games Begin!' : "Let's Play!"}
          </button>
          {hasEmptyNames && (
            <p className="text-sm text-red-400 text-center -mt-3">
              {gameMode === 'multiplayer'
                ? 'All players need a name to compete'
                : 'Enter your name to start'}
            </p>
          )}

          {/* Theme Selection */}
          <div className={`p-3 sm:p-4 rounded-lg ${isOlympics ? 'bg-blue-50' : 'bg-purple-50'}`}>
            <h3 className={`text-lg font-bold mb-3 ${isOlympics ? 'text-blue-800' : 'text-purple-800'}`}>
              Theme
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  title={theme.name}
                  className={`h-12 rounded-lg transition-all flex items-center justify-center gap-1 active:scale-95 ${
                    selectedTheme === theme.id
                      ? isOlympics
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{theme.emoji}</span>
                  <span className="text-xs whitespace-nowrap hidden sm:inline">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card Pairs Slider */}
          <div className={`p-3 sm:p-4 rounded-lg space-y-2 ${isOlympics ? 'bg-blue-50' : 'bg-purple-50'}`}>
            <h3 className={`text-lg font-bold ${isOlympics ? 'text-blue-800' : 'text-purple-800'}`}>
              Card Pairs: {numPairs}
            </h3>
            <div className="px-1">
              <input
                type="range"
                min="2"
                max="10"
                value={numPairs}
                onChange={(e) => setNumPairs(Number(e.target.value))}
                className={`touch-slider ${
                  isOlympics ? 'bg-blue-200 text-blue-600' : 'bg-purple-200 text-purple-600'
                }`}
              />
            </div>
            <div className={`flex justify-between text-sm font-medium px-1 ${
              isOlympics ? 'text-blue-700' : 'text-purple-700'
            }`}>
              <span>2</span>
              <span>10</span>
            </div>

            <div className="flex flex-wrap justify-center gap-1 py-2">
              {Array.from({ length: totalCards }).map((_, i) => (
                <div
                  key={i}
                  className="w-7 h-7 bg-white/50 rounded flex items-center justify-center text-sm"
                >
                  {cardEmoji}
                </div>
              ))}
            </div>
          </div>

          {/* Community Stats from Supabase */}
          <GameStats isOlympics={isOlympics} />
        </div>
      </div>
    </div>
  );
};

export default PlayerSetup;
