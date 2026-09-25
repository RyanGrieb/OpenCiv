import { Game } from "../Game";
import { WebsocketClient } from "../network/Client";
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

    public async ensureInGame() {
        if (this.game.getCurrentScene().getName() !== "in_game") {
            if (this.game.getCurrentScene().getName() === "main_menu") {
                WebsocketClient.init("localhost");
                await this.delay(1000);
            }

            if (this.game.getCurrentScene().getName() === "lobby") {
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
    public async startGameWithSecondPlayer(options: { autoEndTurns: boolean }): Promise<WebSocket> {
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
        WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
        await this.waitUntil(() => this.game.getCurrentScene().getName() === "in_game", 15000, "Scene to become in_game");

        return enemySocket;
    }

    public log(message: string, color: string = "white") {
        const debugDiv = document.createElement("div");
        debugDiv.textContent = message;
        debugDiv.style.color = color;
        document.getElementById("test-results")?.appendChild(debugDiv);
    }
}
