import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { City } from "../../city/City";
import { TestUtils } from "../TestUtils";

// With every tech researched, a city stops offering the units whose upgrades are unlocked (Civ 5's
// obsolete tech), and the server refuses to queue one anyway. Ends with the city screen open.
export function setupObsoleteUnitsTest(game: Game) {
    const runner = new TestRunner("ObsoleteUnits");
    const utils = new TestUtils(game);
    const obsolete = ["Warrior", "Archer", "Spearman", "Composite Bowman"];
    const replacements = ["Swordsman", "Crossbowman", "Pikeman"];
    let city: City | undefined;
    let offered: string[] = [];

    runner.addStep({
        name: "Start a game with every tech researched and settle a city",
        action: async () => {
            await utils.ensureInGame({ allowBarbarians: false, startWithAllTechs: true });

            const settler = await utils.findUnitWithAction("settle");
            WebsocketClient.sendMessage({
                event: "unitAction",
                unitX: settler.getTile().getGridX(),
                unitY: settler.getTile().getGridY(),
                id: settler.getID(),
                actionName: "settle"
            });
            await utils.waitUntil(() => utils.getClientPlayer().getCities().length > 0, 5000, "City to be founded");
            city = utils.getClientPlayer().getCities()[0];
            await utils.waitUntil(() => city.hasStats(), 5000, "City stats to arrive");
        },
        verification: () => city !== undefined
    });

    runner.addStep({
        name: "Obsolete units are left out of the production list",
        action: async () => {
            NetworkEvents.on({
                eventName: "updateProductionOptions",
                parentObject: runner,
                callback: (data: any) => (offered = data["units"].map((unit: { name: string }) => unit.name))
            });
            WebsocketClient.sendMessage({ event: "requestProductionOptions", cityName: city.getName() });
            await utils.waitUntil(() => offered.length > 0, 3000, "Production options to arrive");
            utils.log(`Offered: ${offered.join(", ")}`, "yellow");
        },
        verification: () =>
            obsolete.every((name) => !offered.includes(name)) && replacements.every((name) => offered.includes(name))
    });

    runner.addStep({
        name: "The server refuses to queue an obsolete Warrior",
        action: async () => {
            WebsocketClient.sendMessage({ event: "addToProductionQueue", cityName: city.getName(), type: "unit", name: "Warrior" });
            WebsocketClient.sendMessage({ event: "addToProductionQueue", cityName: city.getName(), type: "unit", name: "Swordsman" });
            await utils.waitUntil(() => city.getProductionQueue().length > 0, 3000, "The Swordsman to be queued");
            await utils.delay(500);
        },
        verification: () => city.getProductionQueue().map((item) => item.name).join(",") === "Swordsman"
    });

    runner.addStep({
        name: "Open the city screen to see the production list",
        action: async () => {
            utils.getInGameScene()["openCityUI"](city);
            await utils.delay(1000);
        },
        verification: () => true
    });

    return runner;
}
