# Vue Lab

> Zero-config Component Explorer for Vue & Nuxt

**No stories. No config. Just components.**

Vue Lab automatically scans your Vue/Nuxt project and provides an interactive web UI to browse, preview, and inspect all components. No stories, no fixtures, no configuration needed.

## Features

- **Auto Discovery** — Automatically find all Vue components in your project
- **Live Preview** — Preview components with real-time updates
- **Props Editor** — Interactive props playground for testing
- **Dependency Detection** — Detect missing Pinia, Router, i18n, Nuxt composables
- **SFC Analysis** — Extract props, emits, slots, and dependencies
- **Explorer UI** — Professional 3-panel layout with tree view, search, and filters

## Quick Start

```bash
# Install
npm install -D vue-lab

# Start development mode
npx vue-lab dev
```

Open `http://localhost:5173` in your browser.

## Architecture

Vue Lab is a monorepo with 8 packages:

```
vue-lab
├── packages/
│   ├── cli/        # CLI entry point (vue-lab dev)
│   ├── core/       # Shared types and constants
│   ├── scanner/    # Component discovery & SFC analysis
│   ├── runtime/    # Component preview runtime
│   ├── detector/   # Dependency detection (Pinia, Router, i18n, Nuxt)
│   ├── context/    # Project context runtime (setup detection, injection)
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

### @vue-lab/detector
Dependency detection engine that:
- Detects Pinia usage (`useStore`, `defineStore`, `createPinia`)
- Detects Vue Router usage (`useRouter`, `useRoute`, `RouterLink`)
- Detects vue-i18n usage (`useI18n`, `t()`, `createI18n`)
- Detects Nuxt composables (`useAsyncData`, `useFetch`, `useCookie`)
- Detects inject/provide patterns
- Reports missing packages

### @vue-lab/context
Project context runtime that:
- Detects project setup (Pinia, Router, I18n, Nuxt)
- Manages runtime modes (isolated vs project)
- Provides dependency injection for plugins, providers, stores

### @vue-lab/server
Development server with:
- Express + WebSocket for hot reload
- File watching with chokidar
- Real-time component updates

### @vue-lab/ui
Web UI built with Vue 3 featuring:
- **Explorer Panel** — Collapsible tree view by namespace
- **Preview Panel** — Component preview with tabs (Props, Slots, Source)
- **Inspector Panel** — Component metadata and status
- **Search** — Debounced search with highlighting
- **Filters** — Filter by status (ready/warning/failed)
- **Intelligence Tab** — Used By analysis, Dependency Tree, Import Graph

### @vue-lab/nuxt
Nuxt-specific support featuring:
- Automatic Nuxt project detection
- Nuxt composables support (useNuxtApp, useAsyncData, useFetch)
- Auto-import resolution for components, composables, and utils

### @vue-lab/snapshot
Snapshot system for visual testing:
- Screenshot capture of components
- Snapshot storage and comparison
- Diff viewer with visual highlighting

## Roadmap

- [x] Phase 1: Project Foundation
- [x] Phase 2: Component Discovery Engine
- [x] Phase 3: Vue SFC Analysis
- [x] Phase 4: Component Preview Runtime
- [x] Phase 5: Props Playground
- [x] Phase 6: Dependency Detection
- [x] Phase 7: Project Context Runtime
- [x] Phase 8: Explorer UI
- [x] Phase 9: Component Intelligence
- [x] Phase 10: Snapshot System
- [x] Phase 11: Nuxt Support
- [x] Phase 12: Release & Adoption

## License

MIT
