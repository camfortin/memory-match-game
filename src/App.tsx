import React, { useState, useRef } from 'react';
import PlayerSetup from './components/PlayerSetup';
import GameBoard from './components/GameBoard';
import { Player, GameMode, ComputerDifficulty } from './types';
import { useGameStats } from './hooks/useGameStats';
import { CARD_THEMES } from './components/Card';
import { supabase } from './lib/supabase';
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
  const [gameMode, setGameMode] = useState<GameMode>('multiplayer');
  const [computerDifficulty, setComputerDifficulty] = useState<ComputerDifficulty>('medium');
  const { incrementGamesPlayed, incrementThemeUsage } = useGameStats();
  const gameStartTimeRef = useRef<number>(0);

  // Store the original multiplayer players so we can restore them when switching modes
  const multiplayerPlayersRef = useRef<Player[]>(players);

  const updatePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    try {
      const namesToSave = newPlayers.filter(p => p.name !== 'Computer').map(p => p.name);
      if (namesToSave.length > 0) {
        localStorage.setItem(PLAYER_NAMES_KEY, JSON.stringify(namesToSave));
      }
    } catch {}
  };

  const handleGameModeChange = (mode: GameMode) => {
    if (mode === gameMode) return;

    // Save current multiplayer players before switching away
    if (gameMode === 'multiplayer') {
      multiplayerPlayersRef.current = players;
    }

    setGameMode(mode);

    const firstName = players[0]?.name || savedNames[0] || DEFAULT_NAMES[0];

    if (mode === 'vs-computer') {
      setPlayers([
        { name: firstName, score: 0, pairs: [] },
        { name: 'Computer', score: 0, pairs: [] }
      ]);
    } else if (mode === 'solo') {
      setPlayers([
        { name: firstName, score: 0, pairs: [] }
      ]);
    } else {
      // Restore multiplayer players
      setPlayers(multiplayerPlayersRef.current);
    }
  };

  const handleStartGame = () => {
    gameStartTimeRef.current = Date.now();
    setGameStarted(true);
  };

  const handleGameEnd = () => {
    setGameStarted(false);
    updatePlayers(players.map(p => ({ ...p, score: 0, pairs: [] })));
  };

  const handleGameComplete = () => {
    incrementGamesPlayed();
    incrementThemeUsage(selectedTheme);
    logGameToSupabase();
  };

  const logGameToSupabase = async () => {
    if (!supabase) return;
    const durationSeconds = Math.round((Date.now() - gameStartTimeRef.current) / 1000);
    const highScore = Math.max(...players.map(p => p.score));
    const winners = players.filter(p => p.score === highScore).map(p => p.name);
    try {
      await supabase.from('mem_game_logs').insert({
        player_names: players.map(p => p.name),
        player_scores: players.map(p => p.score),
        winner_names: winners,
        theme: selectedTheme,
        num_pairs: numPairs,
        num_players: players.length,
        duration_seconds: durationSeconds,
      });
    } catch {}
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
            gameMode={gameMode}
            onGameModeChange={handleGameModeChange}
            computerDifficulty={computerDifficulty}
            setComputerDifficulty={setComputerDifficulty}
          />
        ) : (
          <GameBoard
            players={players}
            setPlayers={updatePlayers}
            numPairs={numPairs}
            onGameEnd={handleGameEnd}
            onGameComplete={handleGameComplete}
            selectedTheme={selectedTheme}
            gameMode={gameMode}
            computerDifficulty={computerDifficulty}
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
