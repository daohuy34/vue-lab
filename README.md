# Vue Lab

> Zero-config Component Explorer for Vue & Nuxt

**No stories. No config. Just components.**

Vue Lab automatically scans your Vue/Nuxt project and provides an interactive web UI to browse, preview, and inspect all components. No stories, no fixtures, no configuration needed.

## Features

- **Auto Discovery** — Automatically find all Vue components in your project
- **Live Preview** — Preview components with real-time updates
- **Props Editor** — Interactive props playground for testing
- **Dependency Graph** — Visualize component relationships
- **SFC Analysis** — Extract props, emits, slots, and dependencies

## Quick Start

```bash
# Install
npm install -D vue-lab

# Start development mode
npx vue-lab dev
```

Open `http://localhost:5173` in your browser.

## Architecture

Vue Lab is a monorepo with 6 packages:

```
vue-lab
├── packages/
│   ├── cli/        # CLI entry point (vue-lab dev)
│   ├── core/       # Shared types and constants
│   ├── scanner/    # Component discovery & SFC analysis
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

## Packages

### @vue-lab/core
Shared types and constants used across all packages.

### @vue-lab/scanner
Component discovery engine that:
- Scans `src/**/*.vue` files
- Extracts component metadata (name, namespace, path)
- Parses Vue SFC to extract props, emits, slots
- Builds component dependency graph

### @vue-lab/runtime
Component preview runtime that:
- Dynamically loads Vue components
- Provides error boundary for missing dependencies
- Tracks render status (ready/warning/failed)

### @vue-lab/server
Development server with:
- Express + WebSocket for hot reload
- File watching with chokidar
- Real-time component updates

### @vue-lab/ui
Web UI built with Vue 3 featuring:
- Component browser with search
- Live preview panel
- Props playground
- Dependency visualization

## Roadmap

- [x] Phase 1: Project Foundation
- [x] Phase 2: Component Discovery Engine
- [x] Phase 3: Vue SFC Analysis
- [x] Phase 4: Component Preview Runtime
- [ ] Phase 5: Props Playground
- [ ] Phase 6: Component Search
- [ ] Phase 7: Hot Reload
- [ ] Phase 8: Nuxt Support

## License

MIT
