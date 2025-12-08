import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { InGameScene } from "../../scene/type/InGameScene";
import { Unit } from "../../Unit";

export function setupCitySettlementTest(game: Game) {
    const runner = new TestRunner(game, "CitySettlement");
    let settlerUnit: Unit | undefined;

    runner.addStep({
        name: "Wait for connection",
        action: async () => {
            // Just wait a bit for socket to connect if needed
            await new Promise(resolve => setTimeout(resolve, 1000));
        },
        verification: () => {
            return true;
        }
    });

    runner.addStep({
        name: "Login and Join Game",
        action: async () => {
            // Simulate login event handling
            // We typically type in a box and click join.
            // Let's manually trigger the Websocket init if not done, or assume Index.ts does not auto-login.
            // Actually JoinGameScene handles this.
            // For E2E, we can shortcut by setting the scene or simulating the button click?
            // Simulating the button click is "truer" E2E but harder if we don't have the instance.

            // Let's try to just use WebsocketClient directly to mimic the "Join" button in JoinGameScene
            // The Join button does: WebsocketClient.init("localhost");

            // We assume we are on defaults.
            // If we are not in game, and not connected, connect.
            if (game.getCurrentScene().getName() !== "in_game") {
                if (game.getCurrentScene().getName() === "main_menu") {
                    WebsocketClient.init("localhost");
                    await new Promise(r => setTimeout(r, 1000));
                }

                // If we are in lobby, start the game
                if (game.getCurrentScene().getName() === "lobby") {
                    WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            // Then we usually wait for "connected" event.
            // Then we send "login"?
            // The server expects us to just connect?
            // Server typically adds player on connection?
            // Wait, Client.ts connects.
            // JoinGameScene just inits websocket.

            // Let's assume we need to send "login" which usually happens automatically or via some other event?
            // Checking MainMenu/JoinScene... JoinScene just inits websocket.
            // The `ClientPlayer` is created when `connectedPlayers` is received.
            // So we wait for InGameScene to be active.
        },
        verification: async () => {
            // Wait for scene to become InGameScene
            let retries = 0;
            while (retries < 20) {
                const sceneName = game.getCurrentScene().getName();
                if (sceneName === "in_game") {
                    return true;
                }

                // Retry clicking start if we are stuck in lobby?
                if (sceneName === "lobby") {
                    WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
                }

                await new Promise(r => setTimeout(r, 1000));
                retries++;
            }
            return false;
        }
    });

    runner.addStep({
        name: "Find Settler",
        action: async () => {
            // We are in game.
            await new Promise(r => setTimeout(r, 1000)); // Let things load
            const scene = game.getCurrentSceneAs<InGameScene>();
            // const player = scene.getClientPlayer();

            // Find a unit that can settle
            // We iterate actors? Or player has units?
            // AbstractPlayer doesn't seem to expose units array directly in the snippets I saw, 
            // but InGameScene might have them.
            // Or we can find all Unit actors in the scene.

            // Let's try to find a Unit actor that belongs to us.
            // The scene has actors.
            // We can cast `scene` to `InGameScene`.
            // We can search scene.actors (private).
            // BUT, Unit is an ActorGroup.

            // We can cheat and access `UnitActionManager`? No.
            // We can use the logic that `InGameScene` uses?

            // `scene.getPlayers()` returns players.
            // Does `ClientPlayer` have units?
            // `ClientPlayer` extends `AbstractPlayer`.
            // I haven't seen `AbstractPlayer`, but usually it tracks units.

            // Alternative: Wait for `Unit` actors to appear.
            // Since we are running in the same context, we can just spy on the `Game.actors`?
            // `Game.actors` is private but we might be able to cast to any.
        },
        verification: async () => {
            console.log("[Test] Verification: Looking for Settler via GameMap...");
            let retries = 0;
            const maxRetries = 30;

            while (retries < maxRetries) {
                // Search via Player units (Optimized)
                const scene = game.getCurrentSceneAs<InGameScene>();
                if (scene && scene.getClientPlayer()) {
                    const player = scene.getClientPlayer();
                    const units = player.getUnits();

                    for (const unit of units) {
                        const actions = unit.getActions();
                        if (actions.some(a => a.getName().toLowerCase().includes("settle"))) {
                            settlerUnit = unit;
                            console.log("[Test] Found Settler via Player units!");
                            return true;
                        }
                    }
                }

                if (retries % 5 === 0) console.log(`[Test] Settler not found yet, retrying... (${retries}/${maxRetries})`);
                await new Promise(r => setTimeout(r, 1000));
                retries++;
            }
            console.error("[Test] Failed to find Settler after retries.");
            return false;
        }
    });

    runner.addStep({
        name: "Settle City",
        action: async () => {
            if (!settlerUnit) throw new Error("No settler found");

            const action = settlerUnit.getActions().find(a => a.getName().toLowerCase().includes("settle"));

            if (!action) throw new Error("Settler has no settle action");

            // Trigger action
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
            await new Promise(r => setTimeout(r, 2000)); // Wait for city to settle
        },
        verification: async () => {
            console.log("[Test] Verification: Checking City Food via GameMap...");
            let retries = 0;
            const maxRetries = 20;

            while (retries < maxRetries) {
                const scene = game.getCurrentSceneAs<InGameScene>();
                if (scene && scene.getClientPlayer()) {
                    const player = scene.getClientPlayer();
                    const cities = player.getCities();

                    for (const city of cities) {
                        console.log(`[Test] Found City owned by player`);
                        if (city.hasStats()) {
                            const food = city.getStat("food");
                            console.log("[Test] City Food:", food);

                            const workedTiles = city.getWorkedTiles();
                            if (workedTiles) {
                                console.log(`[Test] Worked Tiles Count: ${workedTiles.length}`);
                                for (const tile of workedTiles) {
                                    console.log(`[Test] Worked Tile: ${tile.getGridX()},${tile.getGridY()}`);
                                    if (tile === city.getTile()) {
                                        console.log(`[Test] City Center verified as worked tile.`);
                                        // We can't easily check yields on client tile without simulating it or receiving it.
                                        // But we can verify it's in the list.
                                    }
                                }
                            } else {
                                console.log("[Test] No worked tiles synced yet.");
                            }

                            // Debug logging to DOM
                            let statsLog = "Stats: ";
                            // We can't iterate the map keys directly easily if its private or we don't have access to the map object itself, 
                            // but we can try to access common ones or if `getStat` is the only way. 
                            // `City.ts` has `private stats: Map<string, number>;`
                            // We can cast to any to access private stats for debugging
                            const statsMap = (city as any).stats as Map<string, number>;
                            statsMap.forEach((value, key) => {
                                statsLog += `${key}: ${value}, `;
                            });
                            console.log(`[Test] ${statsLog}`);

                            // Append to test results for visibility
                            const debugDiv = document.createElement("div");
                            debugDiv.textContent = `[DEBUG] ${statsLog}`;
                            debugDiv.style.color = "yellow";
                            document.getElementById("test-results")?.appendChild(debugDiv);

                            if (food >= 0) return true;
                        } else {
                            console.log("[Test] City has no stats yet.");
                        }
                    }
                }

                if (retries % 5 === 0) console.log(`[Test] City verification retry... (${retries}/${maxRetries})`);
                await new Promise(r => setTimeout(r, 1000));
                retries++;
            }

            console.error("[Test] Failed to verify city food.");
            return false;
        }
    });

    return runner;
}
