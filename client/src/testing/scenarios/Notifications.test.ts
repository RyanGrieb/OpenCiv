import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { NotificationData } from "../../notification/Notifications";
import { City } from "../../city/City";
import { Tile } from "../../map/Tile";
import { TestUtils } from "../TestUtils";

// Walks through the top-right notifications the server sends: units needing orders, the right-click
// tip, research and production after settling (which also take over the Next Turn button), and a
// "finished" message that goes away when clicked. Ends on a live game to look over by eye: the
// Warrior still needs orders, so its notification stays up.
export function setupNotificationsTest(game: Game) {
    const runner = new TestRunner("Notifications");
    const utils = new TestUtils(game);
    let city: City | undefined;
    let tipTarget: Tile | undefined;

    const notifications = () => utils.getInGameScene().getNotifications();
    const find = (id: string): NotificationData | undefined => notifications().getAll().find((notification) => notification.id === id);
    const finishedMessage = () => notifications().getAll().find((notification) => notification.text.includes("has finished"));
    const nextTurnText = () => utils.getInGameScene().getNextTurnButton().getText();
    const shown = () => utils.log(`Shown: ${notifications().getAll().map((notification) => notification.text).join(" | ")}`, "yellow");

    runner.addStep({
        name: "Login and Join Game",
        action: async () => {
            await utils.ensureInGame();
        },
        verification: async () => game.getCurrentScene().getName() === "in_game"
    });

    runner.addStep({
        name: "Starting units need orders; no research or production without a city",
        action: async () => {
            await utils.waitUntil(() => find("unitOrders") !== undefined, 5000, "Unit orders notification");
            shown();
        },
        verification: () => {
            const unitIds = find("unitOrders").unitIds;
            const ownIds = utils.getClientPlayer().getUnits().map((unit) => unit.getID());
            return unitIds.length === ownIds.length && unitIds.every((id) => ownIds.includes(id)) && !find("research") && !find("production") && nextTurnText() === "Next Turn";
        }
    });

    runner.addStep({
        name: "Clicking it selects each idle unit in turn",
        action: async () => {
            const unitOrders = find("unitOrders");
            const selected: number[] = [];
            for (let i = 0; i < unitOrders.unitIds.length; i++) {
                notifications().act(unitOrders);
                const unit = utils.getClientPlayer().getUnits().find((unit) => unit.isSelected());
                selected.push(unit?.getID());
            }
            utils.log(`Selected in turn: ${selected.join(", ")}`, "yellow");
            if (selected.join() !== unitOrders.unitIds.join()) throw new Error(`Expected ${unitOrders.unitIds.join()}`);
        },
        verification: () => true
    });

    runner.addStep({
        name: "Left-clicking with a unit selected shows the right-click tip; moving drops it",
        action: async () => {
            WebsocketClient.sendMessage({ event: "requestMoveUnitTip" });
            await utils.waitUntil(() => find("moveUnitTip") !== undefined, 3000, "Move tip");
            shown();

            const warrior = utils.getClientPlayer().getUnits().find((unit) => !unit.isUtility());
            tipTarget = warrior.getTile().getAdjacentTiles().find((tile) => tile && !tile.isWater() && tile.getMovementCost() < 9999 && tile.getUnits().length === 0);
            WebsocketClient.sendMessage({
                event: "moveUnit",
                unitX: warrior.getTile().getGridX(),
                unitY: warrior.getTile().getGridY(),
                id: warrior.getID(),
                targetX: tipTarget.getGridX(),
                targetY: tipTarget.getGridY()
            });
            await utils.waitUntil(() => find("moveUnitTip") === undefined, 3000, "Move tip to go away");
        },
        verification: () => find("moveUnitTip") === undefined
    });

    runner.addStep({
        name: "Settling asks for research and production, and Next Turn says so",
        action: async () => {
            const settler = await utils.findUnitWithAction("settle");
            WebsocketClient.sendMessage({
                event: "unitAction",
                unitX: settler.getTile().getGridX(),
                unitY: settler.getTile().getGridY(),
                id: settler.getID(),
                actionName: "settle"
            });
            await utils.waitUntil(() => find("research") !== undefined && find("production") !== undefined, 5000, "Research and production notifications");
            city = utils.getClientPlayer().getCities()[0];
            shown();
        },
        verification: () => {
            const ids = notifications().getAll().map((notification) => notification.id);
            return ids[0] === "research" && ids[1] === "production" && find("production").cityNames.includes(city.getName()) && nextTurnText() === "Choose Research";
        }
    });

    runner.addStep({
        name: "Next Turn opens the research tree instead of ending the turn",
        action: async () => {
            utils.getInGameScene().getNextTurnButton().call("clicked");
            await utils.delay(300);
        },
        verification: () => utils.getInGameScene().getResearchTreeWindow() !== undefined && !utils.getClientPlayer().hasRequestedNextTurn()
    });

    runner.addStep({
        name: "Choosing research clears it; Next Turn moves on to production",
        action: async () => {
            utils.getInGameScene().toggleResearchUI();
            WebsocketClient.sendMessage({ event: "chooseResearch", techName: "Pottery" });
            await utils.waitUntil(() => find("research") === undefined, 3000, "Research notification to go away");
        },
        verification: () => nextTurnText() === "Choose Production"
    });

    runner.addStep({
        name: "Next Turn opens the city needing production",
        action: async () => {
            utils.getInGameScene().getNextTurnButton().call("clicked");
            await utils.delay(1000);
        },
        // The city screen locks the camera while it's open.
        verification: () => utils.getInGameScene().getCamera().isLocked() && !utils.getClientPlayer().hasRequestedNextTurn()
    });

    runner.addStep({
        name: "Close the city screen",
        action: async () => {
            utils.getInGameScene().toggleCityUI();
            await utils.delay(500);
        },
        verification: () => !utils.getInGameScene().getCamera().isLocked()
    });

    runner.addStep({
        name: "Queueing a Warrior clears production; Next Turn is back",
        action: async () => {
            WebsocketClient.sendMessage({ event: "addToProductionQueue", cityName: city.getName(), type: "unit", name: "Warrior" });
            await utils.waitUntil(() => find("production") === undefined, 3000, "Production notification to go away");
        },
        verification: () => nextTurnText() === "Next Turn"
    });

    runner.addStep({
        name: "A finished Warrior shows a message, and clicking it dismisses it",
        action: async () => {
            for (let turn = 0; turn < 40 && !finishedMessage(); turn++) {
                WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
                await utils.delay(400);
                // Pottery can finish first - keep researching so only the message is new.
                if (find("research")) WebsocketClient.sendMessage({ event: "chooseResearch", techName: "Animal Husbandry" });
            }
            if (!finishedMessage()) throw new Error("No Warrior finished within 40 turns");
            shown();

            notifications().act(finishedMessage());
            await utils.waitUntil(() => finishedMessage() === undefined, 3000, "Message to be dismissed");
        },
        verification: () => finishedMessage() === undefined
    });

    return runner;
}
