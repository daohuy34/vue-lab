# Vue Lab

> Zero-config Component Explorer for Vue & Nuxt

**No stories. No config. Just components.**

## Quick Start

```bash
# Install
npm install -D vue-lab

# Start
npx vue-lab dev
```

## Architecture

```
vue-lab
├── packages/
│   ├── cli/        # CLI entry point (vue-lab dev)
│   ├── core/       # Shared types and constants
│   ├── scanner/    # Component discovery engine
│   ├── runtime/    # Component preview runtime
│   ├── server/     # Dev server + WebSocket
│   └── ui/         # Web UI
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start dev mode
pnpm dev
```

## Phase 1 Tasks

- [x] Create Monorepo (pnpm workspace, tsconfig, eslint, vitest)
- [x] CLI Bootstrap (vue-lab dev command)
- [x] Development Server (Vite + Express)
- [x] File Watching (chokidar)

## License

MIT
