export interface Player {
  name: string;
  score: number;
  pairs: string[];
}

export interface ThemeStats {
  fantasy: number;
  vehicles: number;
  thanksgiving: number;
  sports: number;
}

export interface GameStats {
  gamesPlayed: number;
  themeStats: ThemeStats;
  lastVisit: string;
}

export type CardTheme = keyof ThemeStats;