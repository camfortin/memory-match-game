# CLAUDE.md - Project Context for Memory Match Game

## Project Overview
A React + TypeScript memory card matching game built with Vite and Tailwind CSS. Made by Cam Fortin for his daughters (Willa and Lark).

## Tech Stack
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Supabase (configured but lightly used)

## Build & Run
- `npm run dev` - start dev server
- `npm run build` (or `npx vite build`) - production build
- No test suite configured

## Key Architecture

### File Structure
- `src/App.tsx` - Main app component, manages game state, player state, and localStorage for player names
- `src/components/Card.tsx` - Card component + `CARD_THEMES` (the emoji sets for each theme)
- `src/components/PlayerSetup.tsx` - Setup screen: player names, theme picker, card pairs slider
- `src/components/GameBoard.tsx` - Active game board with card grid, scoring, turn logic, end-game modal
- `src/components/GameStats.tsx` - Displays game stats from localStorage
- `src/hooks/useGameStats.ts` - Custom hook for persisting game stats to localStorage
- `src/types.ts` - TypeScript interfaces (Player, GameStats, ThemeStats)
- `src/index.css` - Global styles including custom range slider CSS

### Themes
Five card themes defined in `CARD_THEMES` (Card.tsx):
- **olympics** (Winter Olympic themed): skiing, snowboarding, ice skating, skis, sled, hockey, curling, snowflake, mountain, gold medal
- **fantasy**: unicorn, princess, castle, dragon, fairy, wizard, sword, crown, crystal ball, elf
- **vehicles**: various vehicles
- **thanksgiving**: holiday/Thanksgiving food and family
- **sports**: ball sports

The "olympics" theme has special styling throughout (Olympic rings on card backs, gradient colors, "Go for Gold!" tagline).

### localStorage Keys
- `memory_match_player_names` - JSON array of player name strings (defaults to ["Willa", "Lark"])
- `memory_match_stats` - Game stats (games played, theme usage counts, last visit)

### Styling Notes
- Olympics theme uses blue/yellow/red gradient palette
- Non-Olympics themes use purple/pink palette
- Custom range slider CSS in index.css uses `currentColor` for theme-aware coloring
- Slider track uses `currentColor` with 0.3 opacity for visibility
- Mobile-friendly: 44px touch targets on slider, responsive text sizes

### Player System
- 2-5 players supported
- Players can be reordered via drag-and-drop
- Default names are "Willa" and "Lark" (the creator's daughters)
- Names persist to localStorage when changed
- Players need names to start (validation check)
