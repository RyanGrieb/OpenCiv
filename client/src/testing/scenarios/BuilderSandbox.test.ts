import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { InGameScene } from "../../scene/type/InGameScene";
import { TestUtils } from "../TestUtils";

// Not a test: starts a revealed-map game with every tech researched and a Builder beside your Settler
// (the startWithAllTechs and startWithBuilder game options), then hands it over to play by hand.
export function setupBuilderSandboxTest(game: Game) {
    const runner = new TestRunner("BuilderSandbox");
    const utils = new TestUtils(game);
    let builder: Unit | undefined;

    runner.addStep({
        name: "Start a revealed-map game with every tech and a Builder",
        action: async () => {
            WebsocketClient.init("localhost");
            await utils.waitUntil(() => game.getCurrentScene().getName() === "lobby", 5000, "Scene to become lobby");

            for (const option of ["revealMap", "startWithAllTechs", "startWithBuilder"]) {
                WebsocketClient.sendMessage({ event: "setGameOption", option, value: true });
            }
            // Barbarians would wander into the Builder's way.
            WebsocketClient.sendMessage({ event: "setGameOption", option: "allowBarbarians", value: false });
            WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
            await utils.waitUntil(() => game.getCurrentScene().getName() === "in_game", 15000, "Scene to become in_game");
        },
        verification: () => game.getCurrentScene().getName() === "in_game"
    });

    runner.addStep({
        name: "Center on your Builder",
        action: async () => {
            await utils.waitUntil(
                () => (builder = utils.getClientPlayer()?.getUnits().find((unit) => unit.getName() === "Builder")) !== undefined,
                10000,
                "Your Builder to appear"
            );
            game.getCurrentSceneAs<InGameScene>().focusOnTile(builder.getTile(), 3);

            utils.log("Select your Builder to see what it can build on its tile. Hover a", "yellow");
            utils.log("button for its name and build time; the Builder works at each turn's end.", "yellow");

            // Let clicks through to the map wherever this log sits.
            const results = document.getElementById("test-results");
            if (results) results.style.pointerEvents = "none";
        },
        verification: () => !!builder
    });

    return runner;
}
