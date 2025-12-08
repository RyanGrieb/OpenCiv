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

    public log(message: string, color: string = "white") {
        const debugDiv = document.createElement("div");
        debugDiv.textContent = message;
        debugDiv.style.color = color;
        document.getElementById("test-results")?.appendChild(debugDiv);
    }
}
