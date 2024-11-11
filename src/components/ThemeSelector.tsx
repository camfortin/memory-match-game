import React from 'react';
import { themes } from '../data/themes';
import type { ThemeKey } from '../types';

interface ThemeSelectorProps {
  selectedTheme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ selectedTheme, onThemeChange }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-600">
        Card Theme
      </label>
      <div className="grid grid-cols-3 gap-3">
        {Object.values(themes).map((theme) => (
          <button
            key={theme.key}
            onClick={() => onThemeChange(theme.key)}
            className={`p-4 rounded-lg flex flex-col items-center gap-2 transition-all ${
              selectedTheme === theme.key
                ? 'bg-purple-600 text-white shadow-lg scale-105'
                : 'bg-white hover:bg-purple-50'
            }`}
          >
            <span className="text-2xl">{theme.emoji}</span>
            <span className="text-sm font-medium">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;