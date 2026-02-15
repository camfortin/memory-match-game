import { useState, useEffect } from 'react';
import { GameStats, ThemeStats } from '../types';

const STORAGE_KEY = 'memory_match_stats';

const defaultStats: GameStats = {
  gamesPlayed: 0,
  themeStats: {
    olympics: 0,
    fantasy: 0,
    vehicles: 0,
    thanksgiving: 0,
    sports: 0
  },
  lastVisit: new Date().toISOString()
};

export const useGameStats = () => {
  const [stats, setStats] = useState<GameStats>(defaultStats);

  // Load stats on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new theme keys
        setStats({
          ...defaultStats,
          ...parsed,
          themeStats: {
            ...defaultStats.themeStats,
            ...parsed.themeStats
          }
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  const incrementGamesPlayed = () => {
    setStats(prev => {
      const newStats = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
      } catch (error) {
        console.error('Failed to save stats:', error);
      }
      return newStats;
    });
  };

  const incrementThemeUsage = (theme: keyof ThemeStats) => {
    setStats(prev => {
      const newStats = {
        ...prev,
        themeStats: {
          ...prev.themeStats,
          [theme]: (prev.themeStats[theme] || 0) + 1
        }
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
      } catch (error) {
        console.error('Failed to save stats:', error);
      }
      return newStats;
    });
  };

  return {
    stats,
    incrementGamesPlayed,
    incrementThemeUsage
  };
};
