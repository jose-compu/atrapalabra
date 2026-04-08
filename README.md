# Atrapalabra

A browser-based Spanish word game built with React and Vite. Trace paths on a letter grid by selecting adjacent tiles to form valid Spanish words, earn points, and advance through 20 increasingly challenging levels.

## Features

- 20 levels with rising target scores, minimum word lengths, and curated letter pools
- Adjacency-based tile selection on a dynamic grid
- Built-in Spanish dictionary validation
- Progress persistence via cookies (unlocked levels, scores, profile)
- Sound feedback
- Social sharing (WhatsApp, Facebook)

## Tech Stack

- **React 19** + **react-dom**
- **Vite 8** (dev server with HMR, production bundler)
- **ESLint 9** for linting

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

Output goes to `dist/`.

### Preview Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
  App.jsx            # Main game UI and state
  main.jsx           # React entry point
  game/
    engine.js        # Board generation, adjacency, paths, scoring
    levels.js        # Level definitions and targets
    spanishDict.js   # Spanish dictionary data
    cookies.js       # Profile and progress persistence
    sound.js         # Audio feedback
    tileSkins.js     # Tile visuals
scripts/             # Offline generators for level/word-chain data
```

## License

This project is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
