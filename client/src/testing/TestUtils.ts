import { Game } from "../Game";
import { WebsocketClient } from "../network/Client";
import { GameMap } from "../map/GameMap";
import { Tile } from "../map/Tile";
import { InGameScene } from "../scene/type/InGameScene";
import { Unit } from "../Unit";

export class TestUtils {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    public async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async waitUntil(condition: () => boolean | Promise<boolean>, timeoutMs: number = 5000, message: string = "Condition not met"): Promise<void> {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            if (await condition()) {
                return;
            }
            await this.delay(500);
        }
        throw new Error(`Timeout waiting for: ${message}`);
    }

    // Game options to set in the lobby before starting. Barbarians are off unless a scenario asks for
    // them: they wander up to cities and take the tiles the older scenarios expect to be free.
    public async ensureInGame(gameOptions: Record<string, boolean | number> = { allowBarbarians: false }) {
        if (this.game.getCurrentScene().getName() !== "in_game") {
            if (this.game.getCurrentScene().getName() === "main_menu") {
                WebsocketClient.init("localhost");
                await this.delay(1000);
            }

            if (this.game.getCurrentScene().getName() === "lobby") {
                for (const [option, value] of Object.entries(gameOptions)) {
                    WebsocketClient.sendMessage({ event: "setGameOption", option, value });
                }
                WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
                await this.delay(1000);
            }

            await this.waitUntil(() => this.game.getCurrentScene().getName() === "in_game", 10000, "Scene to become in_game");
        }
    }

    public getInGameScene(): InGameScene {
        const scene = this.game.getCurrentSceneAs<InGameScene>();
        if (!scene || this.game.getCurrentScene().getName() !== "in_game") {
            throw new Error("Current scene is not InGameScene");
        }
        return scene;
    }

    public getClientPlayer() {
        return this.getInGameScene().getClientPlayer();
    }

    public async findUnitWithAction(actionNameFragment: string): Promise<Unit> {
        let foundUnit: Unit | undefined;

        await this.waitUntil(() => {
            const player = this.getClientPlayer();
            if (!player) return false;

            const units = player.getUnits();
            for (const unit of units) {
                if (unit.getActions().some(a => a.getName().toLowerCase().includes(actionNameFragment.toLowerCase()))) {
                    foundUnit = unit;
                    return true;
                }
            }
            return false;
        }, 10000, `Find unit with action '${actionNameFragment}'`);

        if (!foundUnit) throw new Error(`Could not find unit with action '${actionNameFragment}'`);
        return foundUnit;
    }

    /**
     * Joins as Player1, brings in a second player over a bare websocket from this same page, and starts
     * a revealed-map game with both players' settlers two tiles apart. The second player only loads in;
     * with `autoEndTurns` it also asks for every next turn straight away, so the turn moves on as soon
     * as Player1 ends theirs. Returns its socket so a scenario can act for it.
     */
    public async startGameWithSecondPlayer(options: {
        autoEndTurns: boolean;
        // Extra game options on top of the ones below, e.g. { startWithArcher: true }.
        gameOptions?: Record<string, boolean | number>;
    }): Promise<WebSocket> {
        WebsocketClient.init("localhost");
        await this.waitUntil(() => this.game.getCurrentScene().getName() === "lobby", 5000, "Scene to become lobby");

        const enemySocket = new WebSocket(`ws://localhost:${import.meta.env.VITE_SERVER_PORT}/`);
        const endTurn = () => enemySocket.send(JSON.stringify({ event: "nextTurnRequest", value: true }));
        enemySocket.addEventListener("message", (message) => {
            const data = JSON.parse(message.data);
            if (data.event === "setScene" && data.scene === "in_game") {
                enemySocket.send(JSON.stringify({ event: "loadedIn" }));
                if (options.autoEndTurns) endTurn();
            }
            if (data.event === "newTurn" && options.autoEndTurns) endTurn();
        });
        await this.waitUntil(() => enemySocket.readyState === WebSocket.OPEN, 5000, "Second player to connect");
        await this.delay(500);

        WebsocketClient.sendMessage({ event: "setGameOption", option: "revealMap", value: true });
        WebsocketClient.sendMessage({ event: "setGameOption", option: "spawnPlayersTogether", value: true });
        // Barbarian units would count as a second enemy, and wander into the fight.
        WebsocketClient.sendMessage({ event: "setGameOption", option: "allowBarbarians", value: false });
        // Options stick on the server between games, so an earlier scenario's Archer and damaged cities are undone.
        const gameOptions = { startWithArcher: false, cityStartingHealth: 200, ...options.gameOptions };
        for (const [option, value] of Object.entries(gameOptions)) {
            WebsocketClient.sendMessage({ event: "setGameOption", option, value });
        }
        WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
        await this.waitUntil(() => this.game.getCurrentScene().getName() === "in_game", 15000, "Scene to become in_game");

        return enemySocket;
    }

    // Every tile from `minDistance` to `maxDistance` steps from `target`, walking tile adjacency.
    public tilesAround(target: Tile, minDistance: number, maxDistance: number): Tile[] {
        const seen = new Set<Tile>([target]);
        const found: Tile[] = [];
        let frontier = [target];
        for (let distance = 1; distance <= maxDistance; distance++) {
            const next: Tile[] = [];
            for (const tile of frontier) {
                for (const neighbor of tile.getAdjacentTiles()) {
                    if (!neighbor || seen.has(neighbor)) continue;
                    seen.add(neighbor);
                    next.push(neighbor);
                    if (distance >= minDistance) found.push(neighbor);
                }
            }
            frontier = next;
        }
        return found;
    }

    // Of `candidates`, the open land tile that `unit` can reach soonest.
    public nearestFreeTile(unit: Unit, candidates: Tile[]): Tile | undefined {
        let best: { tile: Tile; length: number } | undefined;
        for (const tile of candidates) {
            if (!tile || tile.isWater() || tile.getMovementCost() >= 9999 || tile.getCity()) continue;
            if (tile.getUnits().some((other) => other !== unit)) continue;
            if (tile === unit.getTile()) return tile;

            const path = GameMap.getInstance().constructShortestPath(unit, unit.getTile(), tile);
            if (path.length > 1 && (!best || path.length < best.length)) best = { tile, length: path.length };
        }
        return best?.tile;
    }

    // Walks a unit onto the nearest open tile of `candidates`, calling `endTurn` until it gets there with
    // movement to spare. `send` gives the move order, as us or as a second player.
    public async walkTo(
        unit: Unit,
        candidates: () => Tile[],
        send: (data: Record<string, unknown>) => void,
        endTurn: () => Promise<void>
    ) {
        for (let turn = 0; turn < 8; turn++) {
            const destination = this.nearestFreeTile(unit, candidates());
            if (!destination) throw new Error(`No open tile for the ${unit.getName()} to walk to`);
            if (unit.getTile() === destination && unit.getAvailableMovement() > 0) return;

            if (unit.getTile() !== destination) {
                send({
                    event: "moveUnit",
                    unitX: unit.getTile().getGridX(),
                    unitY: unit.getTile().getGridY(),
                    id: unit.getID(),
                    targetX: destination.getGridX(),
                    targetY: destination.getGridY()
                });
            }
            await this.delay(500);
            if (unit.getTile() === destination && unit.getAvailableMovement() > 0) return;
            await endTurn();
        }
        throw new Error(`The ${unit.getName()} couldn't get into position`);
    }

    public log(message: string, color: string = "white") {
        const debugDiv = document.createElement("div");
        debugDiv.textContent = message;
        debugDiv.style.color = color;
        document.getElementById("test-results")?.appendChild(debugDiv);
    }
}
