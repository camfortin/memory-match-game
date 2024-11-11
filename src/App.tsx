import React, { useState } from 'react';
import PlayerSetup from './components/PlayerSetup';
import GameBoard from './components/GameBoard';
import { Player } from './types';
import { useGameStats } from './hooks/useGameStats';
import './index.css';

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([
    { name: 'Lark', score: 0, pairs: [] },
    { name: 'Willa', score: 0, pairs: [] }
  ]);
  const [numPairs, setNumPairs] = useState(5);
  const [isThreePlayers, setIsThreePlayers] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<'fantasy' | 'vehicles' | 'thanksgiving' | 'sports'>('fantasy');
  const { incrementGamesPlayed, incrementThemeUsage } = useGameStats();

  const handlePlayerToggle = () => {
    setIsThreePlayers(prev => {
      if (!prev) {
        setPlayers([...players, { name: 'Player 3', score: 0, pairs: [] }]);
      } else {
        setPlayers(players.slice(0, 2));
      }
      return !prev;
    });
  };

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleGameEnd = () => {
    setGameStarted(false);
    setPlayers(players.map(p => ({ ...p, score: 0, pairs: [] })));
  };

  const handleGameComplete = () => {
    incrementGamesPlayed();
    incrementThemeUsage(selectedTheme);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col">
      <div className="flex-grow">
        {!gameStarted ? (
          <PlayerSetup
            players={players}
            setPlayers={setPlayers}
            numPairs={numPairs}
            setNumPairs={setNumPairs}
            isThreePlayers={isThreePlayers}
            onTogglePlayers={handlePlayerToggle}
            onStartGame={handleStartGame}
            selectedTheme={selectedTheme}
            setSelectedTheme={setSelectedTheme}
          />
        ) : (
          <GameBoard
            players={players}
            setPlayers={setPlayers}
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
          className="text-purple-600 hover:text-purple-800 transition-colors"
        >
          Cam on LinkedIn
        </a>
          <span> - </span> 
        <a 
          href="https://www.producthacker.ai" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-purple-600 hover:text-purple-800 transition-colors"
        >
          Product Hacker AI
        </a>
      </footer>
    </div>
  );
};

export default App;