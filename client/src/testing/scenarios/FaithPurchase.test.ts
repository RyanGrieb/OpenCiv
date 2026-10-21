import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { ChooseProductionList, ProductionListMode } from "../../ui/windows/city/ChooseProductionList";
import { TestUtils } from "../TestUtils";

const PANTHEON_COST = 10;
const PROPHET_COST = 200;
// A Great Prophet is sure to be born at its cost plus 95 Faith (a 5% chance, and 1% more per Faith past it).
const SURE_PROPHET = PROPHET_COST + 95;
const MOSQUE_COST = 200;

// Buys a Mosque with faith against a live server: on the pantheons map preset with Faith for a pantheon,
// a sure Great Prophet and a Mosque (the startingFaith game option), and every tech so the prophet takes
// only its cost as it does from the Industrial Era on, rather than all the Faith. Founds a pantheon,
// waits a turn for the prophet, and founds Islam with the Mosques follower belief. The city screen's faith Buy then lists the
// Mosque at 200 Faith, and buying it spends the faith, drops it from the still-open list, and adds it
// to the city's buildings list.
export function setupFaithPurchaseTest(game: Game) {
    const runner = new TestRunner("FaithPurchase");
    const utils = new TestUtils(game);
    let faithBefore = 0;

    const me = () => utils.getClientPlayer();
    const faith = () => me().getAccumulatedStat("faith");
    const city = () => me().getCities()[0];
    const prophet = () => me().getUnits().find((unit) => unit.getName() === "Great Prophet");
    const scene = () => utils.getInGameScene() as unknown as Record<string, any>;
    const cityScreen = () => scene()["cityDisplayInfo"] as Record<string, any>;
    const openList = (): ChooseProductionList | undefined => cityScreen()?.["chooseProductionList"];
    // The rows of the city screen's own buildings list.
    const buildingRows = (): string[] =>
        ((cityScreen()?.["buildingsWindow"] as Record<string, any>)?.["rows"] ?? []).map(
            (row: any) => row.getLabel().getText() as string
        );
    const listRows = (mode: ProductionListMode): string[] => {
        const list = openList();
        if (list?.getMode() !== mode) return [];
        return ((list as unknown as Record<string, any>)["rows"] as any[])
            .map((row) => row.getLabel().getText() as string)
            .filter((text) => !["Units", "Buildings"].includes(text));
    };

    runner.addStep({
        name: "Settle, found a pantheon, end the turn for a Great Prophet, and found Islam with Mosques",
        action: async () => {
            await utils.ensureInGame({
                allowBarbarians: false,
                revealMap: true,
                mapPreset: "pantheons",
                startWithAllTechs: true,
                startingFaith: PANTHEON_COST + SURE_PROPHET + MOSQUE_COST
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
            utils.getInGameScene().focusOnTile(city().getTile(), 3);
            WebsocketClient.sendMessage({ event: "foundPantheon", name: "Sacred Path" });
            await utils.waitUntil(() => faith() === SURE_PROPHET + MOSQUE_COST, 5000, "The pantheon to be founded");
            WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
            await utils.waitUntil(() => !!prophet(), 8000, "A Great Prophet to be born");
            WebsocketClient.sendMessage({
                event: "foundReligion",
                unitId: prophet().getID(),
                name: "Islam",
                founderBelief: "Tithe",
                followerBelief: "Mosques"
            });
            await utils.waitUntil(() => !prophet(), 5000, "The religion to be founded");
        },
        verification: () => !prophet() && faith() >= MOSQUE_COST
    });

    runner.addStep({
        name: `Open the city and click the faith Buy: it lists the Mosque at ${MOSQUE_COST} Faith`,
        action: async () => {
            utils.getInGameScene().toggleCityUI(city());
            await utils.waitUntil(() => !!cityScreen(), 5000, "City screen to open");
            cityScreen()["toggleList"]("faith");
            await utils.waitUntil(() => listRows("faith").includes("Mosque"), 5000, "The faith list to show the Mosque");
            await utils.delay(1500);
        },
        verification: () => listRows("faith").includes("Mosque")
    });

    runner.addStep({
        name: `Buy the Mosque: ${MOSQUE_COST} Faith is spent, it leaves the open faith list and shows in the city's buildings`,
        action: async () => {
            faithBefore = faith();
            WebsocketClient.sendMessage({
                event: "purchaseProductionOption",
                currency: "faith",
                cityName: city().getName(),
                type: "building",
                name: "Mosque"
            });
            await utils.waitUntil(() => faith() === faithBefore - MOSQUE_COST, 5000, "The faith to be spent");
            await utils.waitUntil(() => city().getBuildings().some((building) => building.getName() === "Mosque"), 5000, "The Mosque to be built");
            await utils.waitUntil(() => !listRows("faith").includes("Mosque"), 5000, "The faith list to drop the Mosque");
            await utils.delay(1500);
        },
        verification: () =>
            faith() === faithBefore - MOSQUE_COST && !listRows("faith").includes("Mosque") && buildingRows().includes("Mosque")
    });

    return runner;
}
