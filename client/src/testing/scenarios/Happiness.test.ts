import { TestRunner } from "../TestRunner";
import { SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { City } from "../../city/City";
import { HappinessTooltip } from "../../ui/hud/HappinessTooltip";
import { TestUtils } from "../TestUtils";

// Civ 5's numbers, as the server uses them.
const BASE_HAPPINESS = -6; // Lowered from the standard 9 so one city is enough to be very unhappy.
const CITY_UNHAPPINESS = 3;
const CITIZEN_UNHAPPINESS = 1;
const COLOSSEUM_HAPPINESS = 3;
const LUXURY_HAPPINESS = 4;

// Walks the empire-wide happiness from very unhappy back to content against a live server, on the
// happiness map preset (server/config/map_presets.yml): two Citrus and a Cotton beside the Settler,
// each with a Builder on it. The base happiness game option starts it at -6, so founding a city
// (-3, and -1 for its citizen) makes the empire very unhappy. A Colosseum bought with gold lifts it
// to unhappy, and Plantations on the luxuries lift it to content: +4 for Citrus, +4 for Cotton, and
// nothing for the second Citrus. Leaves the status bar's happiness tooltip open to look at.
export function setupHappinessTest(game: Game) {
    const runner = new TestRunner("Happiness");
    const utils = new TestUtils(game);
    let city: City | undefined;

    const me = () => utils.getClientPlayer();
    const clientPlayer = () => me() as unknown as Record<string, any>;
    const happiness = () => me().getHappinessBreakdown();
    const source = (name: string) => happiness().sources.filter((entry) => entry.source === name);
    const statusBar = () => (utils.getInGameScene() as unknown as Record<string, any>)["statusBar"] as Record<string, any>;
    const statusBarShows = (text: string, icon: SpriteRegion) =>
        statusBar()["happinessLabel"].getText() === text && statusBar()["happinessIcon"]["spriteRegion"] === icon;
    const builders = () => (me()?.getUnits() ?? []).filter((unit) => unit.getName() === "Builder");
    // What the tooltip's lines add up to: every source, less every cost.
    const addsUp = () =>
        happiness().net ===
        happiness().sources.reduce((total, entry) => total + entry.amount, 0) -
            happiness().unhappiness.reduce((total, entry) => total + entry.amount, 0);

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
        if (index === -1) throw new Error(`${actionName} isn't offered here`);
        buttons()[index]["callbackFunction"]();
        await utils.waitUntil(() => !!unit.getBuildingImprovement(), 3000, `${actionName} to start`);
    };

    runner.addStep({
        name: `Start on the happiness map with ${BASE_HAPPINESS} base happiness: already unhappy, before any city`,
        action: async () => {
            await utils.ensureInGame({
                allowBarbarians: false,
                revealMap: true,
                startWithAllTechs: true,
                mapPreset: "happiness",
                baseHappiness: BASE_HAPPINESS,
                startingGold: 1000
            });
            await utils.waitUntil(() => builders().length === 3, 90000, "The Builders to appear");
            await utils.waitUntil(() => happiness().net === BASE_HAPPINESS && !!statusBar()?.["happinessLabel"], 90000, "Happiness to arrive");
        },
        verification: () => happiness().status === "unhappy" && statusBarShows(`${BASE_HAPPINESS}`, SpriteRegion.ICON_UNHAPPY)
    });

    runner.addStep({
        name: `Settle: -${CITY_UNHAPPINESS} for the city and -${CITIZEN_UNHAPPINESS} for its citizen make the empire very unhappy, and the city stops growing`,
        action: async () => {
            const settler = await utils.findUnitWithAction("settle");
            utils.getInGameScene().focusOnTile(settler.getTile(), 4);
            WebsocketClient.sendMessage({
                event: "unitAction",
                unitX: settler.getTile().getGridX(),
                unitY: settler.getTile().getGridY(),
                id: settler.getID(),
                actionName: "settle"
            });
            await utils.waitUntil(() => me().getCities().length > 0, 5000, "City to be founded");
            city = me().getCities()[0];
            await utils.waitUntil(() => city.hasStats() && happiness().status === "veryUnhappy", 5000, "Very unhappy");
        },
        verification: () =>
            happiness().net === BASE_HAPPINESS - CITY_UNHAPPINESS - CITIZEN_UNHAPPINESS &&
            happiness().effects.includes("Cities stop growing") &&
            city.getStat("food") <= 0 &&
            statusBarShows(`${happiness().net}`, SpriteRegion.ICON_UNHAPPY) &&
            addsUp()
    });

    runner.addStep({
        name: `Buy a Colosseum: +${COLOSSEUM_HAPPINESS} lifts the empire to unhappy, where growth is only slowed`,
        action: async () => {
            const before = happiness().net;
            WebsocketClient.sendMessage({ event: "purchaseProductionOption", cityName: city.getName(), type: "building", name: "Colosseum" });
            await utils.waitUntil(() => happiness().net === before + COLOSSEUM_HAPPINESS, 5000, "Colosseum's happiness");
        },
        verification: () =>
            happiness().status === "unhappy" &&
            source(`Buildings in ${city.getName()}`)[0]?.amount === COLOSSEUM_HAPPINESS &&
            JSON.stringify(happiness().effects) === JSON.stringify(["City growth -75%"]) &&
            addsUp()
    });

    runner.addStep({
        name: `Build Plantations on both Citrus and the Cotton: +${LUXURY_HAPPINESS} each for Citrus and Cotton, nothing for the second Citrus`,
        action: async () => {
            for (const builder of builders()) await pressAction(builder, "build_plantation");

            const unhappinessBefore = happiness().unhappiness.reduce((total, entry) => total + entry.amount, 0);
            for (let turn = 0; turn < 8 && source("Cotton").length === 0; turn++) {
                WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
                await utils.delay(600);
            }
            await utils.waitUntil(() => source("Citrus").length > 0 && source("Cotton").length > 0, 5000, "Luxuries to count");
            // The city may have grown meanwhile - only its costs could have changed.
            if (happiness().unhappiness.reduce((total, entry) => total + entry.amount, 0) !== unhappinessBefore) {
                throw new Error("The city grew while unhappy, so the totals below no longer line up");
            }
        },
        verification: () =>
            source("Citrus").length === 1 &&
            source("Citrus")[0].amount === LUXURY_HAPPINESS &&
            source("Cotton")[0]?.amount === LUXURY_HAPPINESS &&
            happiness().net ===
                BASE_HAPPINESS - CITY_UNHAPPINESS - CITIZEN_UNHAPPINESS + COLOSSEUM_HAPPINESS + 2 * LUXURY_HAPPINESS &&
            happiness().status === "content" &&
            happiness().effects.length === 0 &&
            statusBarShows(`+${happiness().net}`, SpriteRegion.ICON_MORALE) &&
            addsUp()
    });

    runner.addStep({
        name: "Hovering the status bar's happiness shows where it comes from",
        action: async () => {
            statusBar()["setHoveredStat"]("happiness");
            await utils.waitUntil(() => statusBar()["tooltip"] instanceof HappinessTooltip, 5000, "Happiness tooltip to appear");
        },
        verification: () => statusBar()["tooltip"] instanceof HappinessTooltip
    });

    return runner;
}
