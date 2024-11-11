import React from 'react';
import { Users, GamepadIcon } from 'lucide-react';
import { GameStats } from '../types';

interface StatsProps {
  stats: GameStats;
}

export const Stats: React.FC<StatsProps> = ({ stats }) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-md mx-auto mb-6">
      <div className="flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-600" />
          <span className="text-sm text-gray-600">
            Visitors: <span className="font-semibold">{stats.visitors}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <GamepadIcon className="w-4 h-4 text-purple-600" />
          <span className="text-sm text-gray-600">
            Games: <span className="font-semibold">{stats.gamesPlayed}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Stats;