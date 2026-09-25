import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { City } from "../../city/City";
import { Tile } from "../../map/Tile";
import { GameMap } from "../../map/GameMap";
import { TestUtils } from "../TestUtils";

// Plays the stacking rules out against a live server: units a city finishes while a unit of the same
// type holds the city tile appear next to it, and a unit can walk through - but not stop on - an ally.
export function setupUnitStackingProductionTest(game: Game) {
    const runner = new TestRunner("UnitStackingProduction");
    const utils = new TestUtils(game);
    let settler: Unit | undefined;
    let warrior: Unit | undefined;
    let city: City | undefined;
    let passingWarrior: Unit | undefined;
    let passTarget: Tile | undefined;

    const warriors = () => utils.getClientPlayer().getUnits().filter((unit) => !unit.isUtility());

    const moveUnit = (unit: Unit, target: Tile) => {
        WebsocketClient.sendMessage({
            event: "moveUnit",
            unitX: unit.getTile().getGridX(),
            unitY: unit.getTile().getGridY(),
            id: unit.getID(),
            targetX: target.getGridX(),
            targetY: target.getGridY()
        });
    };

    const endTurnsUntil = async (condition: () => boolean, maxTurns: number, message: string) => {
        for (let turn = 0; turn < maxTurns; turn++) {
            if (condition()) return;
            WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
            await utils.delay(400);
        }
        if (!condition()) throw new Error(`Not reached within ${maxTurns} turns: ${message}`);
    };

    runner.addStep({
        name: "Login and Join Game",
        action: async () => {
            await utils.ensureInGame();
        },
        verification: async () => game.getCurrentScene().getName() === "in_game"
    });

    runner.addStep({
        name: "Settle a city with the starting Settler",
        action: async () => {
            settler = await utils.findUnitWithAction("settle");
            warrior = warriors()[0];

            WebsocketClient.sendMessage({
                event: "unitAction",
                unitX: settler.getTile().getGridX(),
                unitY: settler.getTile().getGridY(),
                id: settler.getID(),
                actionName: "settle"
            });

            await utils.waitUntil(() => utils.getClientPlayer().getCities().length > 0, 5000, "City to be founded");
            city = utils.getClientPlayer().getCities()[0];
        },
        verification: () => city !== undefined && warrior !== undefined
    });

    runner.addStep({
        name: "Station the starting Warrior on the city tile",
        action: async () => {
            moveUnit(warrior, city.getTile());
            await endTurnsUntil(() => warrior.getTile() === city.getTile(), 5, "Warrior to reach the city");
        },
        verification: () => warrior.getTile() === city.getTile()
    });

    runner.addStep({
        name: "Produce two Warriors while the city tile is occupied",
        action: async () => {
            for (let i = 0; i < 2; i++) {
                WebsocketClient.sendMessage({ event: "addToProductionQueue", cityName: city.getName(), type: "unit", name: "Warrior" });
            }
            await utils.delay(500);
            await endTurnsUntil(() => warriors().length >= 3, 120, "Both Warriors to be produced");
        },
        verification: () => {
            const produced = warriors().filter((unit) => unit !== warrior);
            produced.forEach((unit) =>
                utils.log(`Produced Warrior at (${unit.getTile().getGridX()}, ${unit.getTile().getGridY()})`, "yellow")
            );

            const occupiedTiles = new Set(warriors().map((unit) => unit.getTile()));
            const adjacentToCity = produced.every((unit) => city.getTile().getAdjacentTiles().includes(unit.getTile()));

            return produced.length === 2 && occupiedTiles.size === 3 && adjacentToCity;
        }
    });

    runner.addStep({
        name: "A Warrior crosses the city without ever stopping on the allied Warrior",
        action: async () => {
            const cityTile = city.getTile();
            const cityNeighbors = cityTile.getAdjacentTiles();
            const isOpen = (tile: Tile) => tile && !tile.isWater() && tile.getMovementCost() < 9999 && tile.getUnits().length === 0;

            // Straight across the city tile from where it stands. Prefer a route through the ally; a map whose
            // terrain makes the city a whole turn to enter routes around it instead, which is also correct.
            let throughCity = false;
            for (const unit of warriors().filter((unit) => unit !== warrior)) {
                const side = cityNeighbors.indexOf(unit.getTile());
                const opposite = cityNeighbors[(side + 3) % 6];
                if (side < 0 || !isOpen(opposite)) continue;

                const path = GameMap.getInstance().constructShortestPath(unit, unit.getTile(), opposite);
                if (path.length < 2 || (passingWarrior && throughCity)) continue;

                passingWarrior = unit;
                passTarget = opposite;
                throughCity = path.includes(cityTile);
                utils.log(`Client path: ${path.map((tile) => `(${tile.getGridX()},${tile.getGridY()})`).join(" -> ")}`, "yellow");
            }
            if (!passingWarrior) throw new Error("No produced Warrior has a reachable open tile straight across the city");
            if (!throughCity) utils.log("Entering the city takes a whole turn on this map, so the path goes around it", "yellow");

            moveUnit(passingWarrior, passTarget);
            for (let turn = 0; turn < 4 && passingWarrior.getTile() !== passTarget; turn++) {
                await utils.delay(1500);
                if (passingWarrior.getTile() === cityTile) throw new Error("Warrior ended a move on the allied Warrior");
                if (passingWarrior.getTile() !== passTarget) WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
            }
        },
        verification: () => passingWarrior.getTile() === passTarget && warrior.getTile() === city.getTile()
    });

    runner.addStep({
        name: "A Warrior cannot end its move on the allied Warrior",
        action: async () => {
            await endTurnsUntil(() => passingWarrior.getAvailableMovement() >= 2, 2, "Warrior to regain movement");
            moveUnit(passingWarrior, city.getTile());
            await utils.delay(1500);
        },
        verification: () => passingWarrior.getTile() === passTarget && city.getTile().getUnits().filter((unit) => !unit.isUtility()).length === 1
    });

    return runner;
}
