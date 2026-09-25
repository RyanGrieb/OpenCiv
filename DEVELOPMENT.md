# Developing OpenCiv

This guide covers setting up, running, testing and changing OpenCiv. For what the game is and how to play it, see [README.md](README.md). For deeper notes on the architecture and conventions, see [CLAUDE.md](CLAUDE.md).

## Setup

You need [Node.js](https://nodejs.org/) with npm, and git.

```bash
git clone https://github.com/RyanGrieb/OpenCiv.git
cd OpenCiv
npm run install-all   # installs the root, client/ and server/ separately
npm start             # server on ws://localhost:2000, client on http://localhost:1234
```

`npm start` kills whatever holds ports 2000 and 1234 first. The server restarts itself when you save a server file, and the client hot-reloads.

## How the project is laid out

| Path | What's there |
| --- | --- |
| `server/` | The authoritative game: map generation, combat, yields, turn order. Node and TypeScript, no bundler. |
| `server/config/*.yml` | Game data: civilizations, buildings, techs, units, tiles, map resources. |
| `client/` | The browser renderer. Built with Vite, draws to a canvas, and only sends the player's intent to the server. |
| `client/assets/sprites/` | One PNG per sprite, packed into an atlas at startup. |
| `scripts/` | Root dev launchers (`start:ports`, `try`, `test:e2e`, sprite manifest generation). |

The client and server are **separate TypeScript projects with no shared types**. They talk over one WebSocket with messages shaped like `{ event: "name", ...fields }`. If you change an event's payload or a YAML field, update both the server emitter and the client consumer by hand. Nothing checks the two sides against each other, so a mismatch only shows up when you exercise it in game.

## Everyday commands

From the repo root:

| Command | What it does |
| --- | --- |
| `npm start` | Start the server and client on the default ports. |
| `npm run start:ports -- --server-port=2100 --client-port=1240` | Start a pair on other ports, so several can run at once. Unlike `npm start`, it refuses to start if the ports are taken. |
| `npm run format` | Run Prettier over the repo. |
| `npm run generate-sprites` | Regenerate the sprite manifest after adding, removing or renaming a sprite. |
| `npm run generate-docs` | Generate Typedoc API docs into `documentation/`. |
| `docker compose up -d` | Build and run both halves in Docker. |

From `server/`:

| Command | What it does |
| --- | --- |
| `npm test` | Run the Jest suite. |
| `npx jest tests/unit/Unit.test.ts` | Run one test file. |
| `npx jest -t "test name"` | Run one test by name. |
| `npm start -- --help` | List the game options you can set at launch. |
| `npm start -- --no-allowBarbarians --numCityStates=0` | Start with game options overridden. |

Game options can also come from an env var: `GAME_OPTIONS="allowBarbarians=false,numCityStates=0"`. That's handy with `docker compose up` and the root `npm start`, where passing argv through is awkward. Every field on `GameOptions` (in `server/src/GameOptions.ts`) can be set this way with no extra wiring.

## Before you push

CI (`.github/workflows/build.yml`) typechecks each project on its own. Run the same checks:

```bash
cd client && npx tsc --noEmit
cd server && npx tsc -p tsconfig.typecheck.json --noEmit
cd server && npm test
```

The server uses `tsconfig.typecheck.json` to work around a typing problem in the `ts-priority-queue` dependency; CLAUDE.md explains why. Always pass `--noEmit`, or `tsc` writes JS files next to your sources.

`npm run build` in `client/` takes under a second but catches nothing the typecheck doesn't. Only reach for it when you're changing the Vite config or how assets resolve.

## Testing

Testing here means three different things:

1. **Server unit tests.** Jest, headless, in `server/tests/unit/`. Run them with `npm test` from `server/`.
2. **Client scenarios.** In-browser scripted runs, registered in `client/src/testing/ScenarioRegistry.ts`, with scenarios in `client/src/testing/scenarios/`. They have no headless mode.
3. **`npm run test:e2e`.** This starts the server in test mode and the client, then prints a URL like `http://localhost:1234?test=true&scenario=CitySettlement`. Open it in a browser and the scenario plays itself. The command waits rather than exiting with a pass or fail result.

```bash
npm run test:e2e -- --scenario=CitySettlement
```

## Reviewing branches from Claude Code threads

Claude Code threads push their work to `claude/*` branches. Two commands cover testing one and merging it:

```bash
npm run try             # test the most recently pushed claude/* branch
npm run approve         # fast-forward master to it and delete the branch
```

### `npm run try`

```bash
npm run try                          # newest claude/* branch
npm run try -- claude/some-thread    # a specific branch
npm run try -- --list                # recent claude/* branches, newest first
npm run try -- --no-allowBarbarians  # extra arguments go to the server as game options
npm run try -- --clean               # delete every test copy
```

It fetches the branch into its own git worktree under `../OpenCiv-branches/`, so your own checkout and any uncommitted work stay untouched. It runs `npm install` only when a lockfile changed, starts the server and client on the first free ports from 2100/1240 upward, and opens the browser. Trying the same branch again moves its worktree to the latest push. You can have several branches running at once.

### Approve or deny

- **Approve** with `npm run approve` (or `npm run approve -- claude/some-thread`). It lists the commits that will land and asks for confirmation. Then it pushes that exact commit to master and deletes the remote branch in one atomic push, removes the worktree and fast-forwards your local master.
- **Deny** by doing nothing. Go back to the thread and describe what's wrong, and it pushes a fix to the same branch. Run `npm run try` again to test it.

`approve` refuses to go ahead when:
- **you haven't tried the branch**, or **it has new commits since you tried it**. Run `npm run try` again first.
- **master can't fast-forward to the branch**, because master moved on in the meantime. Ask the thread to rebase onto master.

## Common changes

### Adding a sprite

1. Save the PNG as `client/assets/sprites/<category>/<NAME>.png`. `<NAME>` must match the `SpriteRegion` value in `client/src/Assets.ts`. The category folder is only for organization.
2. Run `npm run generate-sprites` and commit the regenerated `client/src/generated/SpriteManifest.ts`.

If a sprite you edited in place doesn't update after a browser refresh, restart the client dev server. The file watcher sometimes misses saves from some image editors.

### Adding game data

Civilizations, buildings, techs, units, tiles and resources live in `server/config/*.yml` and load at runtime. The server sends clients what they need over network events; the client never reads the YAML. If you add a field the client displays, update the client's handler for that event too.

### Adding a game option

Add the field to `GameOptions` and `DefaultGameOptions` in `server/src/GameOptions.ts`. It's settable from the command line straight away. Add a `GameOptionDefinitions` entry to show it in the lobby UI (`hidden: true` puts it under advanced options).

## Code style

- **Method order in a class:** constructor, static methods, public instance methods, then private instance methods.
- **No bare function imports across files.** Put shared helpers on a class as `public static` members and call them by class name, for example `Strings.capitalizeWords(name)` or `UITheme.centerTextY(height)`.
- **Short comments.** One line, or none when the code speaks for itself.
- **Commit titles** use `Category: Description`, named for the subsystem most affected (`UI:`, `Map:`, `City:`, `Server:`, `Dev:`). Check `git log` for examples.
- Run `npm run format` before committing.
