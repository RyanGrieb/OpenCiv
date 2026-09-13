# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

OpenCiv is a browser-based, Civ-5-inspired turn-based strategy game. It's a monorepo with two independent TypeScript projects, `client/` and `server/`, that talk to each other exclusively over a raw WebSocket protocol (no REST API). There is no shared types package between them — see "Client/server split" below.

## Commands

Run all of these from the repo root unless noted.

```bash
npm run install-all      # npm install at root, client/, and server/ (all three are separate node_modules)
npm start                 # boots server (ws://localhost:2000) and client dev server (http://localhost:1234) together
```

Client (`cd client`):
```bash
npm run dev                                    # Parcel dev server with HMR
npm run build                                  # Parcel production build -> client/dist
npx tsc --noEmit                                # typecheck (matches what VSCode/Parcel see)
```

Server (`cd server`):
```bash
npm start                                       # ts-node-dev, respawns on change
npm test                                        # full Jest suite
npx jest tests/unit/Unit.test.ts                # single test file
npx jest -t "test name"                         # single test by name
npx tsc --noEmit                                # typecheck
```

CI typecheck (both projects) — **do not use plain `tsc` for this**, see "The `tsconfig.typecheck.json` split" below:
```bash
npx tsc -p tsconfig.typecheck.json --noEmit
```

Manual/E2E test flow (root):
```bash
npm run test:e2e                                # or: npm run test:e2e -- --scenario=CitySettlement
```
This starts the server in `TEST_MODE=true` and the client dev server, then **prints a URL and waits** — it does not run headlessly and has no pass/fail exit code. Open the printed `http://localhost:1234?test=true&scenario=...` URL in a real browser; the named scenario (registered in `client/src/testing/ScenarioRegistry.ts`) drives itself via `client/src/testing/TestRunner.ts`. Don't treat this script's process exit as a test result.

Other:
```bash
npm run generate-docs   # typedoc for both projects -> documentation/
npm run format           # prettier --write across the repo
docker compose up -d     # alternative to npm start; builds server/client Dockerfiles independently
```

## Architecture

### Client/server split

`client/` and `server/` are separately typed, separately installed TypeScript projects with **no shared package**. Every concept that exists on both sides (`Tile`, `City`, `Unit`, `Player`/`AbstractPlayer`, civilization data) is implemented twice, independently, and kept in sync only by convention:

- The **server is authoritative** — it owns all game state and logic (map generation, combat, yields, turn order).
- The **client renders** what the server tells it and sends back only user intent (move unit, settle city, select civ, etc).
- When you change a network event's payload shape or a YAML config's fields, you must update **both** the server emitter and the client consumer by hand. There is no compiler check across the boundary — a field rename on one side fails silently on the other until you actually exercise it.

### Networking: event pub/sub over one WebSocket

Both sides use the same pattern, implemented separately:
- Server: `server/src/Events.ts` (`ServerEvents.on/call`), payloads typed `Record<string, any>`.
- Client: `client/src/network/Client.ts` (`NetworkEvents.on/call`), generic (`NetworkEvents.on<PayloadType>({...})`) so each call site can declare its own event's shape.

Every message is `{ event: string, ...fields }`, dispatched by `event` name — see `Server.ts`'s `websocket.on("message", ...)` and the client's `WebsocketClient` in `network/Client.ts`. There's no request/response correlation; a "request" is just sending an event and listening for a differently-named reply event.

### Server: state machine

`server/src/Game.ts` is a singleton holding one `currentState` (`server/src/state/State.ts` base class). `Server.ts` registers `"lobby"` (`LobbyState`) and `"in_game"` (`InGameState`) and starts in `"lobby"`. `Game.setState()` calls `onDestroyed()` on the outgoing state (which calls `ServerEvents.clear()` — wipes non-global listeners) then `onInitialize()` on the new one. Each state's `onInitialize()` is where that phase's `ServerEvents.on(...)` listeners get wired up, so listeners are implicitly scoped to the state that registered them.

### Client: scene-based engine

`client/src/Game.ts` is a parallel singleton holding the current `Scene` (`client/src/scene/Scene.ts`), with `Actor`/`ActorGroup` (`client/src/scene/Actor.ts`, `ActorGroup.ts`) as the renderable-object base classes. Scenes (`main_menu`, `join_game`, `lobby`, `in_game`, `loading_scene`) are registered in `client/src/Index.ts` and switched via `Game.setScene()`. `Scene`/`Actor` both have their own generic local `on/call` pub/sub (separate from `NetworkEvents`) for DOM-ish events like `mousemove`/`uiStateChanged`.

### Config-driven game data

Server-side static game data lives in `server/config/*.yml` (`civilizations.yml`, `buildings.yml`, `tiles.yml`, `map_resources.yml`), loaded at runtime via the `yaml` package (not committed as generated JSON/TS). The server broadcasts the relevant slice to clients over network events (e.g. `availableCivs`, `civInfo`) — the client never reads the YAML directly.

### Testing is three different things

1. **Server**: real Jest unit tests in `server/tests/unit/`, run headlessly, mocks classes like `GameMap`/`Player`.
2. **Client**: a custom in-browser scenario runner (`client/src/testing/ScenarioRegistry.ts` + `TestRunner.ts`, scenarios under `client/src/testing/scenarios/*.test.ts`), triggered by loading the app with `?test=true&scenario=<Name>` — there is no headless/CI path for this today.
3. **Root `test:e2e`**: orchestration only — boots both dev servers in test mode and hands you the URL for #2. It's a human-in-the-loop workflow, not an automated test command.

### The `tsconfig.typecheck.json` split

Both `client/tsconfig.json` and `server/tsconfig.json` have `noImplicitAny: true`. A dependency, `ts-priority-queue`, ships parallel `.ts`/`.d.ts` files, and TypeScript resolves imports of it to the untyped `.ts` source instead of the package's own `.d.ts` — this trips one unavoidable `noImplicitAny` diagnostic on third-party code in both projects under plain `tsc`.

Each project has a **type shim** at `src/types/ts-priority-queue.d.ts` (mirrors the package's real `.d.ts`) and a **`tsconfig.typecheck.json`** that extends the real config and adds a `paths` remap to that shim. CI (`.github/workflows/build.yml`) runs `tsc -p tsconfig.typecheck.json`, which is clean.

**The remap deliberately does not live in the real `tsconfig.json`.** Parcel also reads that file's `compilerOptions.paths` for its own bundling — adding the remap there makes Parcel try to bundle the type-only shim as if it were a runtime module, which hangs the build. So: plain `npx tsc --noEmit` (and VSCode) will still show that one `ts-priority-queue` diagnostic — that's expected and not a regression to "fix" by touching `node_modules` or the real tsconfig.

### Odd-but-harmless: `parent-package` self-dependency

`client/package.json` and `server/package.json` both depend on `"parent-package": "file:.."` (the repo root). Nothing actually imports from it — it's inert. Don't try to "clean it up" without checking both lockfiles; removing it is a bigger change than it looks like for zero behavioral gain.
