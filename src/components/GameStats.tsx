import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ThemeCount {
  theme: string;
  count: number;
}

interface PairsCount {
  num_pairs: number;
  count: number;
}

const THEME_LABELS: Record<string, { name: string; emoji: string }> = {
  olympics: { name: 'Winter', emoji: '❄️' },
  fantasy: { name: 'Fantasy', emoji: '🏰' },
  vehicles: { name: 'Vehicles', emoji: '🚗' },
  thanksgiving: { name: 'Holiday', emoji: '🦃' },
  sports: { name: 'Sports', emoji: '⚽' },
  easter: { name: 'Easter', emoji: '🐰' },
};

const GameStats: React.FC<{ isOlympics: boolean }> = ({ isOlympics }) => {
  const [totalGames, setTotalGames] = useState<number>(0);
  const [themeCounts, setThemeCounts] = useState<ThemeCount[]>([]);
  const [pairsCounts, setPairsCounts] = useState<PairsCount[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const fetchStats = async () => {
      try {
        const { count } = await supabase
          .from('mem_game_logs')
          .select('*', { count: 'exact', head: true });
        setTotalGames(count ?? 0);

        const { data: logs } = await supabase
          .from('mem_game_logs')
          .select('theme, num_pairs');

        if (logs) {
          const themeMap = new Map<string, number>();
          const pairsMap = new Map<number, number>();
          for (const log of logs) {
            themeMap.set(log.theme, (themeMap.get(log.theme) || 0) + 1);
            pairsMap.set(log.num_pairs, (pairsMap.get(log.num_pairs) || 0) + 1);
          }
          setThemeCounts(
            Array.from(themeMap.entries())
              .map(([theme, count]) => ({ theme, count }))
              .sort((a, b) => b.count - a.count)
          );
          setPairsCounts(
            Array.from(pairsMap.entries())
              .map(([num_pairs, count]) => ({ num_pairs, count }))
              .sort((a, b) => b.count - a.count)
          );
        }
        setLoaded(true);
      } catch {
        setLoaded(true);
      }
    };

    fetchStats();
  }, []);

  if (!supabase || !loaded || totalGames === 0) return null;

  const accentText = isOlympics ? 'text-blue-700' : 'text-purple-700';
  const barColor = isOlympics ? 'bg-blue-400' : 'bg-purple-400';
  const maxThemeCount = themeCounts[0]?.count || 1;
  const maxPairsCount = pairsCounts[0]?.count || 1;

  return (
    <div className={`p-3 sm:p-4 rounded-lg ${isOlympics ? 'bg-blue-50' : 'bg-purple-50'}`}>
      <h3 className={`text-lg font-bold mb-3 ${isOlympics ? 'text-blue-800' : 'text-purple-800'}`}>
        Community Stats
      </h3>
      <p className="text-sm text-gray-500 mb-3">
        {totalGames} game{totalGames !== 1 ? 's' : ''} played
      </p>

      {themeCounts.length > 0 && (
        <div className="mb-4">
          <h4 className={`text-sm font-semibold mb-2 ${accentText}`}>Popular Themes</h4>
          <div className="space-y-1.5">
            {themeCounts.map(({ theme, count }) => {
              const label = THEME_LABELS[theme];
              return (
                <div key={theme} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-center">{label?.emoji ?? '?'}</span>
                  <span className="w-16 truncate text-gray-600">{label?.name ?? theme}</span>
                  <div className="flex-1 bg-white rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all`}
                      style={{ width: `${(count / maxThemeCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-500 text-xs">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pairsCounts.length > 0 && (
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${accentText}`}>Popular Card Counts</h4>
          <div className="space-y-1.5">
            {pairsCounts.map(({ num_pairs, count }) => (
              <div key={num_pairs} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-center text-gray-500">{num_pairs}</span>
                <span className="w-16 truncate text-gray-600">{num_pairs * 2} cards</span>
                <div className="flex-1 bg-white rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all`}
                    style={{ width: `${(count / maxPairsCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-gray-500 text-xs">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameStats;
