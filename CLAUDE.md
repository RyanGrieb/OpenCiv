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

### Don't run `npm run build` to verify a change

`tsc -p tsconfig.typecheck.json --noEmit` is the gate CI enforces and is what you should run after editing client code. A Parcel production build takes many minutes from a cold cache and reports nothing the typecheck didn't already catch — it is not a smoke test. Only run it when the bundler output itself is what's in question (a Parcel config/asset-resolution change).

If you do run it and it exceeds the tool timeout, it gets backgrounded and **killing the task does not kill Parcel** — the npm wrapper dies and the `parcel build` child keeps running, holding an LMDB lock on `client/.parcel-cache`. Every later `rm -rf .parcel-cache` then fails with `Device or resource busy`, and retrying the build just adds another orphan. Recover by stopping the stray processes first:
```bash
# PowerShell - find and stop orphaned parcel/npm-build node processes
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*parcel*' }
```

Manual/E2E test flow (root):
```bash
npm run test:e2e                                # or: npm run test:e2e -- --scenario=CitySettlement
```
This starts the server in `TEST_MODE=true` and the client dev server, then **prints a URL and waits** — it does not run headlessly and has no pass/fail exit code. Open the printed `http://localhost:1234?test=true&scenario=...` URL in a real browser; the named scenario (registered in `client/src/testing/ScenarioRegistry.ts`) drives itself via `client/src/testing/TestRunner.ts`. Don't treat this script's process exit as a test result.

Other:
```bash
npm run generate-docs   # typedoc for both projects -> documentation/
npm run generate-sprites # regenerate client/src/generated/SpriteManifest.ts after touching client/assets/sprites/
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

### Sprite assets

Every sprite is its own file under `client/assets/sprites/<category>/<NAME>.png` — `<NAME>` must exactly match the `SpriteRegion` value it's for in `client/src/Assets.ts` (e.g. `tiles/TILE_GRASS.png` for `SpriteRegion.TILE_GRASS`); which category folder it sits in is just organization and has no effect on lookup. After adding, removing, or renaming a sprite file, run `npm run generate-sprites` and commit the regenerated `client/src/generated/SpriteManifest.ts` — Parcel needs the static `new URL(...)` calls in that generated file to bundle each sprite, so it can't be built dynamically at runtime.

At startup, `client/src/SpriteAtlas.ts` packs every sprite in the manifest into one canvas (replacing the old fixed-grid `spritesheet.png` approach). In production the packed result is cached in IndexedDB, keyed by a hash of the manifest; in dev, caching is skipped entirely since Parcel serves sprite URLs unhashed, so an edited sprite's pixels wouldn't otherwise bust the cache. Editing a sprite in place sometimes isn't picked up by Parcel's dev-server watcher (seen with saves from MS Paint) — if a change to a `.png` doesn't show up after a browser refresh, restart `npm run dev`.

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

## Coding style

- **Method order within a class: constructor, then static methods, then public instance methods, then private instance methods.** Static methods go directly after the constructor, before instance methods — the first methods a reader sees in a class. See `client/src/map/Tile.ts` (`gridDistance`, `riverCrosses`, `getWeight`, `setTileYields`, `getTileYields` all sit right after the constructor) or `server/src/city/City.ts` (`getBuildingDataByName`). This is the intended convention going forward; some older files (e.g. `client/src/map/Tile.ts`, `server/src/Player.ts`) still interleave a private helper next to its public caller rather than segregating by visibility — don't take those as the pattern to copy, but there's no need to proactively rewrite them either.
- **Never import a bare function across files — call it qualified through its owner.** Shared helpers live as `public static` members on a class named after the module, so call sites read `Strings.capitalizeWords(name)` or `UITheme.centerTextY(height)`, never a loose `capitalizeWords(name)` imported by name. Write new shared helpers as statics on such a class (see `client/src/util/Strings.ts`, `client/src/ui/UITheme.ts`) rather than as exported standalone functions. Shared *constants* follow the same shape when they belong to one of these groupings (`UITheme.FONT`, `ButtonSize.LARGE`).

## Commit messages

**Never run `git commit` unless the user explicitly asks for a commit in that message.** Finishing an implementation, fixing a bug, or the user saying "proceed"/"looks good" is not a request to commit — leave changes staged/unstaged in the working tree and say what's ready, then wait to be told to commit.

Title format is `Category: Description` (e.g. `Client: Fix resize bugs...`, `Server: Restrict types to node+jest...`, `City:`, `UI:`). The category is the subsystem most affected, not necessarily which project (client/server) the diff touches — a change that spans both but is user-facing through the UI (e.g. a server-pushed stat the client displays) is titled `UI:`, not `Client:`/`Server:`. Check `git log` for current examples before writing a new one.

### Odd-but-harmless: `parent-package` self-dependency

`client/package.json` and `server/package.json` both depend on `"parent-package": "file:.."` (the repo root). Nothing actually imports from it — it's inert. Don't try to "clean it up" without checking both lockfiles; removing it is a bigger change than it looks like for zero behavioral gain.
