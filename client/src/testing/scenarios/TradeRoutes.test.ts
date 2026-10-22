import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { Unit } from "../../Unit";
import { City } from "../../city/City";
import { WebsocketClient } from "../../network/Client";
import { TestUtils } from "../TestUtils";

// City connections and trade routes. Two Settlers found cities four tiles apart with a road between
// them, so the second is connected to the capital and earns gold. Then a Caravan on the road walks into
// the capital and sets up a food trade route to the second city, from the trade route list.
export function setupTradeRoutesTest(game: Game) {
    const runner = new TestRunner("TradeRoutes");
    const utils = new TestUtils(game);

    const me = () => utils.getClientPlayer();
    const scene = () => utils.getInGameScene();
    const list = () => scene().getTradeRouteList();
    const caravan = (): Unit | undefined => me().getUnits().find((unit) => unit.getName() === "Caravan");
    const capital = (): City | undefined => me().getCities()[0];
    const otherCity = (): City | undefined => me().getCities()[1];
    const connected = () => me().getGoldBreakdown().income.some((entry) => entry.source === "City connections (1 city)");
    const roadUpkeep = () =>
        me().getGoldBreakdown().expenses.find((entry) => entry.source.startsWith("Road maintenance"))?.amount ?? 0;
    const sendAction = (unit: Unit, actionName: string) =>
        WebsocketClient.sendMessage({
            event: "unitAction",
            unitX: unit.getTile().getGridX(),
            unitY: unit.getTile().getGridY(),
            id: unit.getID(),
            actionName
        });
    let foodBefore = 0;

    runner.addStep({
        name: "Start with every tech, two Settlers and a Caravan",
        action: async () => {
            await utils.ensureInGame({
                allowBarbarians: false,
                numCityStates: 0,
                revealMap: true,
                mapPreset: "trade_routes",
                startWithAllTechs: true
            });
            await utils.waitUntil(
                () => me()?.getUnits().filter((unit) => unit.getName() === "Settler").length === 2 && !!caravan(),
                10000,
                "Both Settlers and the Caravan to appear"
            );
        },
        verification: () => !!caravan()
    });

    runner.addStep({
        name: "Found both cities: the road connects the second to the capital, and costs upkeep",
        action: async () => {
            me()
                .getUnits()
                .filter((unit) => unit.getName() === "Settler")
                .forEach((settler) => sendAction(settler, "settle"));
            await utils.waitUntil(() => me().getCities().length === 2, 5000, "Both cities to be founded");
            scene().focusOnTile(caravan().getTile(), 3);
            await utils.waitUntil(() => connected() && roadUpkeep() > 0, 5000, "City connection gold and road upkeep");
        },
        verification: () => connected() && roadUpkeep() > 0
    });

    runner.addStep({
        name: "Walk the Caravan into the capital: Establish Trade Route opens the list of routes",
        action: async () => {
            const unit = caravan();
            WebsocketClient.sendMessage({
                event: "moveUnit",
                unitX: unit.getTile().getGridX(),
                unitY: unit.getTile().getGridY(),
                id: unit.getID(),
                targetX: capital().getTile().getGridX(),
                targetY: capital().getTile().getGridY()
            });
            const canEstablish = () =>
                caravan()?.getTile() === capital().getTile() &&
                caravan().getActions().some((action) => action.getName() === "establish_trade_route" && action.requirementsMet(caravan()));
            await utils.waitUntil(canEstablish, 5000, "The Caravan to reach the capital and offer a trade route");

            scene().toggleTradeRouteUI(caravan().getID());
            await utils.waitUntil(() => list()?.getOptionNames().includes(`${otherCity().getName()}:food`), 5000, "The trade route list to fill");
        },
        verification: () => list()?.getOptionNames().length === 2
    });

    runner.addStep({
        name: "Send food to the second city: the Caravan is used up and the city gets +3 Food",
        action: async () => {
            foodBefore = otherCity().getStat("food");
            list().choose(otherCity().getName(), "food");
            await utils.waitUntil(() => !caravan() && otherCity().getStat("food") === foodBefore + 3, 5000, "The route to start");
        },
        verification: () => !caravan() && !list() && otherCity().getStat("food") === foodBefore + 3
    });

    return runner;
}
