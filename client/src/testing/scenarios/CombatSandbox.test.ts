import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { Unit } from "../../Unit";
import { InGameScene } from "../../scene/type/InGameScene";
import { TestUtils } from "../TestUtils";

// Not a test: sets up MeleeCombat's opening - a revealed map, and a second player whose Warrior, Archer
// and Settler start a couple of tiles from yours - then hands the game over to play by hand. You get an
// Archer too, to try ranged attacks. The second player never acts, and ends its turn as soon as each one
// starts, so Next Turn works as normal.
export function setupCombatSandboxTest(game: Game) {
    const runner = new TestRunner("CombatSandbox");
    const utils = new TestUtils(game);
    let warrior: Unit | undefined;

    runner.addStep({
        name: "Start a revealed-map game next to a second player",
        action: async () => {
            await utils.startGameWithSecondPlayer({ autoEndTurns: true, gameOptions: { startWithArcher: true } });
        },
        verification: () => game.getCurrentScene().getName() === "in_game"
    });

    runner.addStep({
        name: "Center on your Warrior",
        action: async () => {
            await utils.waitUntil(
                () => {
                    warrior = utils.getClientPlayer().getUnits().find((unit) => unit.getName() === "Warrior");
                    return !!warrior;
                },
                10000,
                "Your Warrior to appear"
            );
            game.getCurrentSceneAs<InGameScene>().focusOnTile(warrior.getTile(), 3);

            utils.log("Your turn. Select your Warrior, then right-click and drag onto an", "yellow");
            utils.log("enemy next to it to see the combat preview. Release to attack.", "yellow");
            utils.log("Your Archer shoots up to 2 tiles: press B (or its Ranged Attack button), hover", "yellow");
            utils.log("a red enemy to preview, left-click to fire (right-click cancels).", "yellow");

            // Let clicks through to the map wherever this log sits.
            const results = document.getElementById("test-results");
            if (results) results.style.pointerEvents = "none";
        },
        verification: () => !!warrior
    });

    return runner;
}
