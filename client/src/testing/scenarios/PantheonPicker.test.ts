import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { TestUtils } from "../TestUtils";

const PANTHEON_COUNT = 26;

// Opens the Choose Pantheon list and leaves it up to look at: settles a city on the pantheons map
// preset with the 10 Faith the first pantheon costs, then clicks the turn button, which reads Choose
// Pantheon. Hover a pantheon for its tooltip, or click one to found it.
export function setupPantheonPickerTest(game: Game) {
    const runner = new TestRunner("PantheonPicker");
    const utils = new TestUtils(game);

    const me = () => utils.getClientPlayer();
    const scene = () => utils.getInGameScene();
    const list = () => scene().getPantheonList();

    runner.addStep({
        name: "Start with 10 Faith and settle a city",
        action: async () => {
            await utils.ensureInGame({ allowBarbarians: false, revealMap: true, mapPreset: "pantheons", startingFaith: 10 });
            const settler = await utils.findUnitWithAction("settle");
            WebsocketClient.sendMessage({
                event: "unitAction",
                unitX: settler.getTile().getGridX(),
                unitY: settler.getTile().getGridY(),
                id: settler.getID(),
                actionName: "settle"
            });
            await utils.waitUntil(() => me().getCities().length > 0, 5000, "City to be founded");
            scene().focusOnTile(me().getCities()[0].getTile(), 3);
            await utils.skipIdleUnits();
            await utils.waitUntil(() => scene().getNextTurnButton().getText() === "Choose Pantheon", 5000, "Choose Pantheon");
        },
        verification: () => scene().getNextTurnButton().getText() === "Choose Pantheon"
    });

    runner.addStep({
        name: "Click Choose Pantheon: the pantheon list opens and stays up",
        action: async () => {
            scene().getNextTurnButton().call("clicked");
            await utils.waitUntil(() => list()?.getPantheonNames().length === PANTHEON_COUNT, 5000, "The pantheon list to fill");
        },
        verification: () => list()?.getPantheonNames().length === PANTHEON_COUNT
    });

    return runner;
}
