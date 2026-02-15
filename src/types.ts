export interface Player {
  name: string;
  score: number;
  pairs: string[];
}

export interface ThemeStats {
  olympics: number;
  fantasy: number;
  vehicles: number;
  thanksgiving: number;
  sports: number;
  easter: number;
}

export interface GameStats {
  gamesPlayed: number;
  themeStats: ThemeStats;
  lastVisit: string;
}

export type CardTheme = keyof ThemeStats;
