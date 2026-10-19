import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { City } from "../../city/City";
import { Tile } from "../../map/Tile";
import { TestUtils } from "../TestUtils";

const STARTING_FAITH = 10;
const FIRST_PANTHEON_COST = 10;
const PANTHEON_COUNT = 26;
const CHOSEN = "Desert Folklore";

// Founds a pantheon against a live server, on the pantheons map preset (server/config/map_presets.yml):
// Desert, Flood Plains and Tundra around the Settler, starting with the 10 Faith the world's first
// pantheon costs (the startingFaith game option). The turn button reads Choose Pantheon and opens the
// pantheon list; Desert Folklore is founded from it, and the city's desert tiles gain +1 Faith, which
// the middle-click tile tooltip lists under the pantheon's name. Ends on the faith button's religion window.
export function setupPantheonsTest(game: Game) {
    const runner = new TestRunner("Pantheons");
    const utils = new TestUtils(game);
    let city: City | undefined;
    let desert: Tile | undefined;

    const me = () => utils.getClientPlayer();
    const scene = () => utils.getInGameScene();
    const nextTurnText = () => scene().getNextTurnButton().getText();
    const pantheonNotification = () => scene().getNotifications().getAll().find((notification) => notification.type === "pantheon");
    const list = () => scene().getPantheonList();
    const inspector = () => scene().getTileInspector();
    const sourceNames = () => (inspector().getInfo()?.sources ?? []).map((entry) => entry.source);

    runner.addStep({
        name: `Start on the pantheons map with ${STARTING_FAITH} Faith, and settle beside the Desert`,
        action: async () => {
            await utils.ensureInGame({
                allowBarbarians: false,
                revealMap: true,
                mapPreset: "pantheons",
                startingFaith: STARTING_FAITH
            });
            const settler = await utils.findUnitWithAction("settle");
            WebsocketClient.sendMessage({
                event: "unitAction",
                unitX: settler.getTile().getGridX(),
                unitY: settler.getTile().getGridY(),
                id: settler.getID(),
                actionName: "settle"
            });
            await utils.waitUntil(() => me().getCities().length > 0, 5000, "City to be founded");
            city = me().getCities()[0];
            desert = city.getTile().getAdjacentTiles().find((tile) => tile?.getTileTypes().includes("desert"));
            scene().focusOnTile(city.getTile(), 4);
        },
        verification: () => !!city && !!desert && me().getAccumulatedStat("faith") === STARTING_FAITH
    });

    runner.addStep({
        name: "The faith is enough for a pantheon: a notification says so, and the turn button reads Choose Pantheon",
        action: async () => {
            await utils.skipIdleUnits();
            await utils.waitUntil(() => nextTurnText() === "Choose Pantheon", 5000, "The turn button to read Choose Pantheon");
        },
        verification: () => !!pantheonNotification() && nextTurnText() === "Choose Pantheon"
    });

    runner.addStep({
        name: `Click Choose Pantheon: the list opens with all ${PANTHEON_COUNT} pantheons, costing ${FIRST_PANTHEON_COST} Faith`,
        action: async () => {
            scene().getNextTurnButton().call("clicked");
            await utils.waitUntil(() => list()?.getPantheonNames().length === PANTHEON_COUNT, 5000, "The pantheon list to fill");
        },
        verification: () =>
            list().getPantheonNames().includes(CHOSEN) &&
            list().getPantheonNames().includes("God-King") &&
            list().getRows()[0].getLabel().getText().includes(`${FIRST_PANTHEON_COST} Faith`)
    });

    runner.addStep({
        name: `Hover ${CHOSEN}: its tooltip shows its bonus, and that Oasis isn't in the game yet`,
        action: async () => {
            list().showTooltipFor(CHOSEN);
            await utils.waitUntil(() => !!list().getTooltip(), 3000, "The pantheon tooltip to open");
            await utils.delay(1500);
        },
        verification: () => !!list().getTooltip()
    });

    runner.addStep({
        name: `Choose ${CHOSEN}: the list closes, the Faith is spent, and the turn button no longer asks for a pantheon`,
        action: async () => {
            list().choose(CHOSEN);
            await utils.waitUntil(() => !pantheonNotification(), 5000, "The pantheon notification to go");
        },
        verification: () =>
            !list() &&
            me().getAccumulatedStat("faith") === STARTING_FAITH - FIRST_PANTHEON_COST &&
            nextTurnText() !== "Choose Pantheon"
    });

    runner.addStep({
        name: `The city's Desert now yields +1 Faith, and its middle-click tooltip lists it under ${CHOSEN}`,
        action: async () => {
            await utils.waitUntil(() => desert.getTileYield()?.faith === 1, 5000, "The desert's faith to arrive");
            scene().focusOnTile(desert, 4);
            inspector().inspect(desert, Game.getInstance().getWidth() / 2, Game.getInstance().getHeight() / 2);
            await utils.waitUntil(() => sourceNames().includes(CHOSEN), 5000, "The tile tooltip to list the pantheon");
        },
        verification: () => desert.getTileYield()?.faith === 1 && sourceNames().includes(CHOSEN)
    });

    runner.addStep({
        name: `Click the faith button: the religion window shows ${CHOSEN}, the city following it, and what it adds up to`,
        action: async () => {
            inspector().close();
            scene().toggleReligionUI();
            await utils.waitUntil(() => !!scene().getReligionWindow()?.getOverview(), 5000, "The religion window to fill");
        },
        verification: () => {
            const overview = scene().getReligionWindow().getOverview();
            return overview.pantheon?.name === CHOSEN && overview.cities.length === 1 && overview.cities[0].name === city.getName();
        }
    });

    return runner;
}
