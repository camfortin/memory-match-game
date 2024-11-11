import React from 'react';
import { Gamepad } from 'lucide-react';
import { useGameStats } from '../hooks/useGameStats';

const GameStats: React.FC = () => {
  const { stats } = useGameStats();

  const getMostPopularTheme = () => {
    const { themeStats } = stats;
    const mostPlayed = Object.entries(themeStats).reduce((a, b) => 
      themeStats[a[0]] > themeStats[b[0]] ? a : b
    );
    return {
      name: mostPlayed[0].charAt(0).toUpperCase() + mostPlayed[0].slice(1),
      plays: mostPlayed[1]
    };
  };

  const mostPopular = getMostPopularTheme();

  return (
    <div className="container mx-auto px-4 mb-4">
      <div className="bg-white rounded-lg shadow-md p-4 flex justify-center gap-8">
        <div className="flex items-center gap-2">
          <Gamepad className="w-5 h-5 text-purple-600" />
          <span className="text-gray-600">
            Games Played: <span className="font-semibold">{stats.gamesPlayed}</span>
          </span>
        </div>
        {mostPopular.plays > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">
              Most Popular Theme: <span className="font-semibold">{mostPopular.name}</span> ({mostPopular.plays} games)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameStats;