import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { City } from "../../city/City";
import { Tile } from "../../map/Tile";
import { TestUtils } from "../TestUtils";

const LUXURY_HAPPINESS = 4;
// What each Camp's tile yields with every tech researched (server config/tiles.yml and techs.yml):
// the terrain or feature under it, the resource with its Camp, and Economics' +1 Gold on Ivory and Furs.
const CAMP_YIELDS: Record<string, Record<string, number>> = {
    deer: { food: 2, production: 2, gold: 0 }, // Forest 1/1 on tundra, Deer Camp +1 Food +1 Production
    bison: { food: 2, production: 2, gold: 0 }, // Plains 1/1, Bison Camp +1 Food +1 Production
    ivory: { food: 1, production: 1, gold: 4 }, // Plains 1/1, Ivory Camp +3 Gold, Economics +1
    furs: { food: 1, production: 0, gold: 4 }, // Tundra 1, Furs Camp +3 Gold, Economics +1
    truffles: { food: 1, production: 0, gold: 3 } // Marsh 1 Food on grassland, Truffles Camp +3 Gold
};
const RESOURCES = Object.keys(CAMP_YIELDS);
const LUXURIES = ["Furs", "Ivory", "Truffles"];

// Builds a Camp on each of Civ 5's camp resources against a live server, on the trapping map preset
// (server/config/map_presets.yml): Deer in a tundra forest, Bison, Ivory, Furs, and Truffles in a
// marsh around the Settler, each with a Builder on it, and every tech researched. Checks each Camp's
// yields, and that Ivory, Furs and Truffles count as luxuries for happiness while Deer and Bison don't.
export function setupTrappingTest(game: Game) {
    const runner = new TestRunner("Trapping");
    const utils = new TestUtils(game);
    let city: City | undefined;
    // Each resource's tile, found from the Builder standing on it.
    const tiles: Record<string, Tile> = {};

    const me = () => utils.getClientPlayer();
    const clientPlayer = () => me() as unknown as Record<string, any>;
    const builders = () => (me()?.getUnits() ?? []).filter((unit) => unit.getName() === "Builder");
    const happinessSources = () => me().getHappinessBreakdown().sources.map((entry) => entry.source);
    const yieldMatches = (resource: string) => {
        const tileYield = tiles[resource].getTileYield() ?? {};
        return Object.entries(CAMP_YIELDS[resource]).every(([stat, value]) => (tileYield[stat] ?? 0) === value);
    };

    const select = (unit: Unit) => {
        for (let click = 0; click < 4 && clientPlayer()["selectedUnit"] !== unit; click++) {
            clientPlayer()["onClickedTileWithUnit"](unit.getTile());
        }
        if (clientPlayer()["selectedUnit"] !== unit) throw new Error(`Couldn't select ${unit.getName()}`);
    };

    // Presses the action's button in the unit info window, the way a player would.
    const pressAction = async (unit: Unit, actionName: string) => {
        select(unit);
        const buttons = (): Record<string, any>[] => unit["unitDisplayInfo"]?.["actionButtons"] ?? [];
        const shown = () => unit.getActions().filter((action) => action.requirementsMet(unit));
        await utils.waitUntil(() => buttons().length > 0 && buttons().length === shown().length, 3000, "Action buttons to show");

        const index = shown().findIndex((action) => action.getName() === actionName);
        if (index === -1) throw new Error(`${actionName} isn't offered on ${unit.getTile().getTileTypes().join(", ")}`);
        buttons()[index]["callbackFunction"]();
        await utils.waitUntil(() => !!unit.getBuildingImprovement(), 3000, `${actionName} to start`);
    };

    runner.addStep({
        name: "Start on the trapping map: Deer, Bison, Ivory, Furs and Truffles in a marsh, a Builder on each",
        action: async () => {
            await utils.ensureInGame({
                allowBarbarians: false,
                revealMap: true,
                startWithAllTechs: true,
                mapPreset: "trapping"
            });
            await utils.waitUntil(() => builders().length === RESOURCES.length, 90000, "The Builders to appear");

            for (const builder of builders()) {
                const resource = RESOURCES.find((name) => builder.getTile().getTileTypes().includes(name));
                if (resource) tiles[resource] = builder.getTile();
            }
            utils.getInGameScene().focusOnTile(tiles.bison, 4);
        },
        verification: () =>
            RESOURCES.every((resource) => !!tiles[resource]) &&
            tiles.deer.getTileTypes().includes("forest") &&
            tiles.truffles.getTileTypes().includes("marsh") &&
            tiles.truffles.getTileYield()?.food === 1
    });

    runner.addStep({
        name: "Settle: every resource tile is inside the new city's borders",
        action: async () => {
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
        },
        verification: () => RESOURCES.every((resource) => city.getTerritory().includes(tiles[resource]))
    });

    runner.addStep({
        name: "Build a Camp with each Builder, keeping the forest and marsh: each resource becomes its camp",
        action: async () => {
            for (const builder of builders()) await pressAction(builder, "build_camp");

            const allCamped = () => RESOURCES.every((resource) => tiles[resource].getTileTypes().includes(`${resource}_camp`));
            for (let turn = 0; turn < 10 && !allCamped(); turn++) {
                WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
                await utils.delay(600);
            }
            await utils.waitUntil(allCamped, 5000, "Every Camp to finish");
        },
        verification: () =>
            RESOURCES.every((resource) => !tiles[resource].getTileTypes().includes(resource)) &&
            tiles.deer.getTileTypes().includes("forest") &&
            tiles.truffles.getTileTypes().includes("marsh")
    });

    runner.addStep({
        name: "Each Camp yields its bonus: +1 Production on Deer and Bison, +1 Gold on the luxuries, +1 more on Ivory and Furs from Economics",
        action: async () => {
            await utils.waitUntil(() => RESOURCES.every(yieldMatches), 5000, "Camp yields to arrive");
        },
        verification: () => RESOURCES.every(yieldMatches)
    });

    runner.addStep({
        name: `Ivory, Furs and Truffles each add +${LUXURY_HAPPINESS} happiness; Deer and Bison, being bonus resources, add none`,
        action: async () => {
            await utils.waitUntil(() => LUXURIES.every((name) => happinessSources().includes(name)), 5000, "Luxuries to count");
        },
        verification: () =>
            LUXURIES.every(
                (name) =>
                    me().getHappinessBreakdown().sources.find((entry) => entry.source === name)?.amount === LUXURY_HAPPINESS
            ) &&
            !happinessSources().includes("Deer") &&
            !happinessSources().includes("Bison")
    });

    return runner;
}
