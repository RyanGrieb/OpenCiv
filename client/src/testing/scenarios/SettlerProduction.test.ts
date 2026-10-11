import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { City } from "../../city/City";
import { GameMap } from "../../map/GameMap";
import { Tile } from "../../map/Tile";
import { TestUtils } from "../TestUtils";

const SETTLER_COST = 106;
const COST_PERCENT = 20;

// Trains a Settler in a city and founds a second city with it, against a live server. As in Civ 5 the
// city stops growing while it trains the Settler, and its spare food goes into production instead.
// Production costs are cut to 20% (the productionCostPercent game option) so the Settler is quick.
export function setupSettlerProductionTest(game: Game) {
    const runner = new TestRunner("SettlerProduction");
    const utils = new TestUtils(game);
    let city: City | undefined;
    let unitNames: string[] = [];
    let settlerCost = 0;
    let foodBefore = 0;
    let productionBefore = 0;
    let foodBanked = 0;
    let newSettler: Unit | undefined;

    const me = () => utils.getClientPlayer();
    const settlers = () => (me()?.getUnits() ?? []).filter((unit) => unit.getName() === "Settler");
    const allTiles = () => GameMap.getInstance().getTiles().flatMap((column) => (column ?? []).filter(Boolean));

    const endTurnsUntil = async (condition: () => boolean, maxTurns: number, message: string) => {
        for (let turn = 0; turn < maxTurns; turn++) {
            if (condition()) return;
            WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
            await utils.delay(600);
        }
        if (!condition()) throw new Error(`Not reached within ${maxTurns} turns: ${message}`);
    };

    const settle = (settler: Unit) =>
        WebsocketClient.sendMessage({
            event: "unitAction",
            unitX: settler.getTile().getGridX(),
            unitY: settler.getTile().getGridY(),
            id: settler.getID(),
            actionName: "settle"
        });

    runner.addStep({
        name: "Settle: the new city offers a Settler in its production list",
        action: async () => {
            await utils.ensureInGame({ allowBarbarians: false, revealMap: true, productionCostPercent: COST_PERCENT });
            await utils.waitUntil(() => settlers().length > 0, 90000, "The starting Settler to appear");
            const settler = await utils.findUnitWithAction("settle");
            utils.getInGameScene().focusOnTile(settler.getTile(), 3);
            settle(settler);
            await utils.waitUntil(() => me().getCities().length > 0, 5000, "City to be founded");
            city = me().getCities()[0];
            await utils.waitUntil(() => city.hasStats(), 5000, "City stats to arrive");

            NetworkEvents.on({
                eventName: "updateProductionOptions",
                parentObject: runner,
                callback: (data: any) => {
                    unitNames = data["units"].map((unit: { name: string }) => unit.name);
                    settlerCost = data["units"].find((unit: { name: string }) => unit.name === "Settler")?.cost ?? 0;
                }
            });
            WebsocketClient.sendMessage({ event: "requestProductionOptions", cityName: city.getName() });
            await utils.waitUntil(() => unitNames.length > 0, 5000, "Production options to arrive");
        },
        verification: () => unitNames.includes("Settler") && settlerCost === Math.round((SETTLER_COST * COST_PERCENT) / 100)
    });

    runner.addStep({
        name: "Queue a Settler: the city stops growing and its spare food goes into production",
        action: async () => {
            foodBefore = city.getStat("food");
            productionBefore = city.getStat("production");
            foodBanked = city.getStat("foodSurplus");
            WebsocketClient.sendMessage({ event: "addToProductionQueue", cityName: city.getName(), type: "unit", name: "Settler" });
            await utils.waitUntil(() => city.getProductionQueue()[0]?.name === "Settler", 5000, "Settler to be queued");
        },
        verification: () =>
            city.getStat("food") === Math.min(0, foodBefore) &&
            city.getStat("production") === productionBefore + Math.max(0, foodBefore)
    });

    runner.addStep({
        name: "End turns until the Settler is trained, without the city banking any food",
        action: async () => {
            await endTurnsUntil(() => settlers().length > 0, 15, "Settler to be trained");
            newSettler = settlers()[0];
        },
        verification: () => !!newSettler && city.getStat("foodSurplus") <= foodBanked
    });

    runner.addStep({
        name: "Walk the new Settler out and found a second city",
        action: async () => {
            const start = newSettler.getTile();
            const target = allTiles()
                .filter((tile: Tile) => !tile.isWater() && [3, 4].includes(Tile.gridDistance(start, tile)))
                .map((tile) => ({ tile, path: GameMap.getInstance().constructShortestPath(newSettler, start, tile) }))
                .filter(({ path }) => path.length > 1)
                .sort((a, b) => a.path.length - b.path.length)[0]?.tile;
            if (!target) throw new Error("No land 3-4 tiles from the city to settle on");

            WebsocketClient.sendMessage({
                event: "moveUnit",
                unitX: start.getGridX(),
                unitY: start.getGridY(),
                id: newSettler.getID(),
                targetX: target.getGridX(),
                targetY: target.getGridY()
            });
            await endTurnsUntil(() => newSettler.getTile() === target, 10, "Settler to reach its spot");
            await endTurnsUntil(() => newSettler.getAvailableMovement() > 0, 2, "Settler to have movement left");

            utils.getInGameScene().focusOnTile(target, 3);
            settle(newSettler);
            await utils.waitUntil(() => me().getCities().length === 2, 5000, "Second city to be founded");
        },
        verification: () => me().getCities().length === 2
    });

    return runner;
}
