import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { TestUtils } from "../TestUtils";

export function setupCitySettlementTest(game: Game) {
    const runner = new TestRunner("CitySettlement");
    const utils = new TestUtils(game);
    let settlerUnit: Unit | undefined;

    runner.addStep({
        name: "Login and Join Game",
        action: async () => {
            await utils.ensureInGame();
        },
        verification: async () => {
            return game.getCurrentScene().getName() === "in_game";
        }
    });

    runner.addStep({
        name: "Find Settler",
        action: async () => {
            // Find a unit with 'settle' action
            settlerUnit = await utils.findUnitWithAction("settle");
        },
        verification: () => {
            return settlerUnit !== undefined;
        }
    });

    runner.addStep({
        name: "Settle City",
        action: async () => {
            if (!settlerUnit) throw new Error("No settler found");

            const action = settlerUnit.getActions().find(a => a.getName().toLowerCase().includes("settle"));
            if (!action) throw new Error("Settler has no settle action");

            WebsocketClient.sendMessage({
                event: "unitAction",
                unitX: settlerUnit.getTile().getGridX(),
                unitY: settlerUnit.getTile().getGridY(),
                id: settlerUnit.getID(),
                actionName: action.getName()
            });
        }
    });

    runner.addStep({
        name: "Check Food Output",
        action: async () => {
            await utils.delay(2000); // Wait for city to settle
        },
        verification: async () => {
            await utils.waitUntil(() => {
                const player = utils.getClientPlayer();
                if (!player) return false;

                const cities = player.getCities();
                for (const city of cities) {
                    if (city.hasStats()) {
                        const food = city.getStat("food");
                        console.log(`[Test] City Food: ${food}`);

                        // Debug stats
                        const statsMap = (city as any).stats as Map<string, number>;
                        let statsLog = "Stats: ";
                        statsMap.forEach((value, key) => statsLog += `${key}: ${value}, `);

                        // Append to test results for visibility
                        utils.log(`[DEBUG] ${statsLog}`, "yellow");

                        if (food >= 0) return true;
                    }
                }
                return false;
            }, 5000, "City with stats to exist");
            return true;
        }
    });

    return runner;
}
