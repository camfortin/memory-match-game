import React, { useState } from 'react';
import PlayerSetup from './components/PlayerSetup';
import GameBoard from './components/GameBoard';
import { Player } from './types';
import { useGameStats } from './hooks/useGameStats';
import { CARD_THEMES } from './components/Card';
import './index.css';

const PLAYER_NAMES_KEY = 'memory_match_player_names';
const DEFAULT_NAMES = ['Willa', 'Lark'];

function loadSavedNames(): string[] {
  try {
    const saved = localStorage.getItem(PLAYER_NAMES_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_NAMES;
}

const App: React.FC = () => {
  const savedNames = loadSavedNames();
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([
    { name: savedNames[0] || DEFAULT_NAMES[0], score: 0, pairs: [] },
    { name: savedNames[1] || DEFAULT_NAMES[1], score: 0, pairs: [] }
  ]);
  const [numPairs, setNumPairs] = useState(5);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof CARD_THEMES>('olympics');
  const { incrementGamesPlayed, incrementThemeUsage } = useGameStats();

  const updatePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    try {
      localStorage.setItem(PLAYER_NAMES_KEY, JSON.stringify(newPlayers.map(p => p.name)));
    } catch {}
  };

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleGameEnd = () => {
    setGameStarted(false);
    updatePlayers(players.map(p => ({ ...p, score: 0, pairs: [] })));
  };

  const handleGameComplete = () => {
    incrementGamesPlayed();
    incrementThemeUsage(selectedTheme);
  };

  const isOlympics = selectedTheme === 'olympics';

  return (
    <div className={`min-h-screen flex flex-col ${
      isOlympics
        ? 'bg-gradient-to-br from-blue-50 via-white to-red-50'
        : 'bg-gradient-to-br from-purple-100 to-pink-100'
    }`}>
      <div className="flex-grow">
        {!gameStarted ? (
          <PlayerSetup
            players={players}
            setPlayers={updatePlayers}
            numPairs={numPairs}
            setNumPairs={setNumPairs}
            onStartGame={handleStartGame}
            selectedTheme={selectedTheme}
            setSelectedTheme={setSelectedTheme}
          />
        ) : (
          <GameBoard
            players={players}
            setPlayers={updatePlayers}
            numPairs={numPairs}
            onGameEnd={handleGameEnd}
            onGameComplete={handleGameComplete}
            selectedTheme={selectedTheme}
          />
        )}
      </div>
      <footer className="text-center py-4 text-gray-600 text-sm">
        <p className="mb-2">Made by Cam Fortin for his awesome daughters.</p>
        <a
          href="https://www.linkedin.com/in/camfortin/"
          target="_blank"
          rel="noopener noreferrer"
          className={`${isOlympics ? 'text-blue-600 hover:text-blue-800' : 'text-purple-600 hover:text-purple-800'} transition-colors`}
        >
          Cam on LinkedIn
        </a>
          <span> - </span>
        <a
          href="https://www.producthacker.ai"
          target="_blank"
          rel="noopener noreferrer"
          className={`${isOlympics ? 'text-blue-600 hover:text-blue-800' : 'text-purple-600 hover:text-purple-800'} transition-colors`}
        >
          Product Hacker AI
        </a>
      </footer>
    </div>
  );
};

export default App;
