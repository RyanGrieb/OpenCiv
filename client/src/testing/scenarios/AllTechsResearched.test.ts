import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { NotificationData } from "../../notification/Notifications";
import { TestUtils } from "../TestUtils";

// With every tech already researched (the startWithAllTechs game option), settling a city must not
// ask for research, and Next Turn must end the turn instead of showing "Choose Research".
export function setupAllTechsResearchedTest(game: Game) {
    const runner = new TestRunner("AllTechsResearched");
    const utils = new TestUtils(game);
    let turnsEnded = 0;

    const notifications = () => utils.getInGameScene().getNotifications();
    const find = (id: string): NotificationData | undefined => notifications().getAll().find((notification) => notification.id === id);
    const nextTurnText = () => utils.getInGameScene().getNextTurnButton().getText();

    runner.addStep({
        name: "Start a game with every tech researched",
        action: async () => {
            await utils.ensureInGame({ allowBarbarians: false, startWithAllTechs: true });
        },
        verification: () => game.getCurrentScene().getName() === "in_game"
    });

    runner.addStep({
        name: "Settling asks for production but not research",
        action: async () => {
            const settler = await utils.findUnitWithAction("settle");
            WebsocketClient.sendMessage({
                event: "unitAction",
                unitX: settler.getTile().getGridX(),
                unitY: settler.getTile().getGridY(),
                id: settler.getID(),
                actionName: "settle"
            });
            await utils.waitUntil(() => find("production") !== undefined, 5000, "Production notification");
            // Give a wrongly sent research notification the same chance to arrive.
            await utils.delay(500);
        },
        verification: () => !find("research") && nextTurnText() === "Choose Production"
    });

    runner.addStep({
        name: "Queueing production brings back Next Turn",
        action: async () => {
            const city = utils.getClientPlayer().getCities()[0];
            WebsocketClient.sendMessage({ event: "addToProductionQueue", cityName: city.getName(), type: "unit", name: "Scout" });
            await utils.waitUntil(() => find("production") === undefined, 3000, "Production notification to go away");
        },
        verification: () => !find("research") && nextTurnText() === "Next Turn"
    });

    runner.addStep({
        name: "Next Turn ends the turn, and research stays quiet afterwards",
        action: async () => {
            NetworkEvents.on({ eventName: "newTurn", parentObject: runner, callback: () => turnsEnded++ });
            utils.getInGameScene().getNextTurnButton().call("clicked");
            await utils.waitUntil(() => turnsEnded > 0, 5000, "The turn to end");
            await utils.delay(500);
        },
        verification: () => turnsEnded > 0 && !find("research") && nextTurnText() !== "Choose Research"
    });

    return runner;
}
