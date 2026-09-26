import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { City } from "../../city/City";
import { GameMap } from "../../map/GameMap";
import { InGameScene } from "../../scene/type/InGameScene";
import { TestUtils } from "../TestUtils";

// Civ 5's settling rule against a live server: no city within two tiles of another, and none inside
// another civilization's borders. The Settlers spawn two tiles apart, so once the second player founds
// its city ours has to walk a tile further out first.
export function setupCitySpacingTest(game: Game) {
    const runner = new TestRunner("CitySpacing");
    const utils = new TestUtils(game);
    let enemySocket: WebSocket | undefined;
    let mySettler: Unit | undefined;
    let enemyCity: City | undefined;

    const me = () => utils.getClientPlayer();
    const allUnits = () => {
        const units: Unit[] = [];
        for (const column of GameMap.getInstance().getTiles()) {
            for (const tile of column ?? []) units.push(...(tile?.getUnits() ?? []));
        }
        return units;
    };
    const myCities = () => {
        const cities: City[] = [];
        for (const column of GameMap.getInstance().getTiles()) {
            for (const tile of column ?? []) if (tile?.getCity()?.getPlayer() === me()) cities.push(tile.getCity());
        }
        return cities;
    };
    const canSettle = () =>
        mySettler.getActions().some((action) => action.getName() === "settle" && action.requirementsMet(mySettler));
    const settle = (unit: Unit, send: (data: Record<string, unknown>) => void) =>
        send({
            event: "unitAction",
            unitX: unit.getTile().getGridX(),
            unitY: unit.getTile().getGridY(),
            id: unit.getID(),
            actionName: "settle"
        });
    const sendAsUs = (data: Record<string, unknown>) => WebsocketClient.sendMessage(data);
    const endTurn = async () => {
        WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
        await utils.delay(800);
    };

    runner.addStep({
        name: "Start a revealed-map game with a second player, Settlers two tiles apart",
        action: async () => {
            enemySocket = await utils.startGameWithSecondPlayer({ autoEndTurns: true });
            await utils.waitUntil(
                () => allUnits().filter((unit) => unit.getName() === "Settler").length === 2,
                10000,
                "Both Settlers to appear"
            );
            mySettler = me().getUnits().find((unit) => unit.getName() === "Settler");
        },
        verification: () => game.getCurrentScene().getName() === "in_game" && !!mySettler
    });

    runner.addStep({
        name: "The second player founds a city two tiles from our Settler",
        action: async () => {
            const enemySettler = allUnits().find((unit) => unit.getName() === "Settler" && unit.getPlayer() !== me());
            const enemyTile = enemySettler.getTile();
            settle(enemySettler, (data) => enemySocket.send(JSON.stringify(data)));
            await utils.waitUntil(() => !!enemyTile.getCity(), 10000, "The enemy city to be founded");
            enemyCity = enemyTile.getCity();
            game.getCurrentSceneAs<InGameScene>().focusOnTile(enemyTile, 3);
        },
        verification: () => !!enemyCity && utils.tilesAround(enemyCity.getTile(), 1, 2).includes(mySettler.getTile())
    });

    runner.addStep({
        name: "Our Settler's Settle City action is unavailable there",
        action: async () => {
            await utils.waitUntil(() => !canSettle(), 5000, "Settle City to become unavailable");
        },
        verification: () => !canSettle()
    });

    runner.addStep({
        name: "The server refuses a settle order sent anyway",
        action: async () => {
            settle(mySettler, sendAsUs);
            await utils.delay(1500);
        },
        verification: () => myCities().length === 0 && allUnits().includes(mySettler)
    });

    runner.addStep({
        name: "Our Settler walks three tiles from the enemy city, outside its borders, and can settle there",
        action: async () => {
            await utils.walkTo(mySettler, () => utils.tilesAround(enemyCity.getTile(), 3, 3), sendAsUs, endTurn);
            await utils.waitUntil(canSettle, 5000, "Settle City to become available");
        },
        verification: () => utils.tilesAround(enemyCity.getTile(), 3, 3).includes(mySettler.getTile()) && canSettle()
    });

    runner.addStep({
        name: "Our city is founded three tiles from the enemy city",
        action: async () => {
            settle(mySettler, sendAsUs);
            await utils.waitUntil(() => myCities().length === 1, 10000, "Our city to be founded");
        },
        verification: () => utils.tilesAround(enemyCity.getTile(), 3, 3).includes(myCities()[0]?.getTile())
    });

    return runner;
}
