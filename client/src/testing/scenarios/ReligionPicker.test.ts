import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { TestUtils } from "../TestUtils";

// Opens the religion founding window and leaves it up to look at: settles a city on the pantheons map
// preset with enough Faith for a pantheon and a religion, founds a pantheon, then clicks the turn
// button, which reads Found Religion. Hover a belief for its tooltip, choose a religion and two
// beliefs, then Found Religion.
export function setupReligionPickerTest(game: Game) {
    const runner = new TestRunner("ReligionPicker");
    const utils = new TestUtils(game);

    const me = () => utils.getClientPlayer();
    const scene = () => utils.getInGameScene();
    const founding = () => scene().getReligionFoundingWindow();

    runner.addStep({
        name: "Start with 210 Faith, settle a city and found a pantheon",
        action: async () => {
            await utils.ensureInGame({ allowBarbarians: false, revealMap: true, mapPreset: "pantheons", startingFaith: 210 });
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
            WebsocketClient.sendMessage({ event: "foundPantheon", name: "Sacred Path" });
            await utils.skipIdleUnits();
            await utils.waitUntil(() => scene().getNextTurnButton().getText() === "Found Religion", 5000, "Found Religion");
        },
        verification: () => scene().getNextTurnButton().getText() === "Found Religion"
    });

    runner.addStep({
        name: "Click Found Religion: the religion founding window opens and stays up",
        action: async () => {
            scene().getNextTurnButton().call("clicked");
            await utils.waitUntil(() => founding()?.getChoices().religion.length === 13, 5000, "The religion founding window to fill");
        },
        verification: () => founding()?.getChoices().religion.length === 13
    });

    return runner;
}
