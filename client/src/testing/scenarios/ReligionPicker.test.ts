import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { TestUtils } from "../TestUtils";

// Opens the religion founding window and leaves it up to look at: settles a city on the pantheons map
// preset with enough Faith for a pantheon and a Great Prophet, founds a pantheon, ends the turn so the
// prophet is born, then uses its Found Religion action. Hover a belief for its tooltip, choose a
// religion and two beliefs, then Found Religion.
export function setupReligionPickerTest(game: Game) {
    const runner = new TestRunner("ReligionPicker");
    const utils = new TestUtils(game);

    const me = () => utils.getClientPlayer();
    const scene = () => utils.getInGameScene();
    const prophet = () => me().getUnits().find((unit) => unit.getName() === "Great Prophet");
    const founding = () => scene().getReligionFoundingWindow();

    runner.addStep({
        name: "Start with 210 Faith, settle a city, found a pantheon and end the turn for a Great Prophet",
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
            await utils.waitUntil(() => me().getAccumulatedStat("faith") === 200, 5000, "The pantheon to be founded");
            WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
            await utils.waitUntil(() => !!prophet(), 8000, "A Great Prophet to be born");
        },
        verification: () => !!prophet()
    });

    runner.addStep({
        name: "Use the prophet's Found Religion: the religion founding window opens and stays up",
        action: async () => {
            scene().toggleReligionFoundingUI(prophet().getID());
            await utils.waitUntil(() => founding()?.getChoices().religion.length === 13, 5000, "The religion founding window to fill");
        },
        verification: () => founding()?.getChoices().religion.length === 13
    });

    return runner;
}
