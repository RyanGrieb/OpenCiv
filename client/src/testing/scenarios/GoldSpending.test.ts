import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { City } from "../../city/City";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { Button } from "../../ui/components/Button";
import { GoldEntry } from "../../ui/hud/GoldTooltip";
import { TestUtils } from "../TestUtils";

const STARTING_GOLD = 1000;
// Civ 5's prices for what this scenario buys, with nothing built toward them yet.
const MONUMENT_PRICE = 270;
const WARRIOR_PRICE = 190;
const SCOUT_PRICE = 140;
const FREE_UNITS = 3;

// Buys production with gold and checks the upkeep that follows, against a live server. The game
// starts with 1000 gold (the startingGold game option). Leaves the city screen open on its buy
// buttons, and the gold tooltip showing, to look at afterwards.
export function setupGoldSpendingTest(game: Game) {
    const runner = new TestRunner("GoldSpending");
    const utils = new TestUtils(game);
    let city: City | undefined;
    let goldBefore = 0;
    let unitsBefore = 0;
    let turnNet = 0;

    const me = () => utils.getClientPlayer();
    const gold = () => me().getAccumulatedStat("gold");
    const expense = (source: string): GoldEntry | undefined =>
        me().getGoldBreakdown().expenses.find((entry) => entry.source.startsWith(source));
    const scene = () => utils.getInGameScene() as unknown as Record<string, any>;
    const statusBar = () => scene()["statusBar"] as Record<string, any>;
    const allActors = (group: ActorGroup): Actor[] => group.getActors();
    const buyButtons = (): Button[] => {
        const cityScreen = scene()["cityDisplayInfo"] as ActorGroup | undefined;
        if (!cityScreen) return [];
        return allActors(cityScreen).filter((actor): actor is Button => actor instanceof Button && /\d$/.test(actor.getText()));
    };

    const spendAndWait = async (send: () => void, price: number, message: string) => {
        goldBefore = gold();
        unitsBefore = me().getUnits().length;
        send();
        await utils.waitUntil(() => gold() === goldBefore - price, 5000, message);
    };

    runner.addStep({
        name: `Start a game with ${STARTING_GOLD} gold`,
        action: async () => {
            await utils.ensureInGame({ allowBarbarians: false, startingGold: STARTING_GOLD });
            await utils.waitUntil(() => !!me() && gold() === STARTING_GOLD, 10000, "Starting gold to arrive");
        },
        verification: () => gold() === STARTING_GOLD
    });

    runner.addStep({
        name: "Settle a city with the starting Settler",
        action: async () => {
            const settler = await utils.findUnitWithAction("settle");
            WebsocketClient.sendMessage({
                event: "unitAction",
                unitX: settler.getTile().getGridX(),
                unitY: settler.getTile().getGridY(),
                id: settler.getID(),
                actionName: "settle"
            });
            await utils.waitUntil(() => me().getCities().length > 0, 5000, "City to be founded");
            city = me().getCities()[0];
            await utils.waitUntil(() => city.hasStats(), 5000, "City stats to arrive");
        },
        verification: () => city !== undefined && me().getGoldBreakdown().income.some((entry) => entry.source === city.getName())
    });

    runner.addStep({
        name: `Buy a Monument from the production list for ${MONUMENT_PRICE} gold: it's built at once and costs 1 gold a turn`,
        action: async () => {
            await spendAndWait(
                () => WebsocketClient.sendMessage({ event: "purchaseProductionOption", cityName: city.getName(), type: "building", name: "Monument" }),
                MONUMENT_PRICE,
                "Monument to be paid for"
            );
            await utils.waitUntil(() => city.getBuildings().some((building) => building.getName() === "Monument"), 5000, "Monument to be built");
        },
        verification: () => expense("Building maintenance")?.amount === 1
    });

    runner.addStep({
        name: `Queue a Warrior and buy it from the queue for ${WARRIOR_PRICE} gold: it appears at once and leaves the queue`,
        action: async () => {
            WebsocketClient.sendMessage({ event: "addToProductionQueue", cityName: city.getName(), type: "unit", name: "Warrior" });
            await utils.waitUntil(() => city.getProductionQueue()[0]?.goldCost === WARRIOR_PRICE, 5000, "Warrior to be queued with its price");
            await spendAndWait(
                () => WebsocketClient.sendMessage({ event: "purchaseQueueItem", cityName: city.getName(), index: 0 }),
                WARRIOR_PRICE,
                "Warrior to be paid for"
            );
            await utils.waitUntil(() => me().getUnits().length === unitsBefore + 1, 5000, "Warrior to appear");
        },
        verification: () => city.getProductionQueue().length === 0
    });

    runner.addStep({
        name: `Buy two Scouts: units past the first ${FREE_UNITS} cost 1 gold a turn each`,
        action: async () => {
            for (let scout = 0; scout < 2; scout++) {
                await spendAndWait(
                    () => WebsocketClient.sendMessage({ event: "purchaseProductionOption", cityName: city.getName(), type: "unit", name: "Scout" }),
                    SCOUT_PRICE,
                    "Scout to be paid for"
                );
                await utils.waitUntil(() => me().getUnits().length === unitsBefore + 1, 5000, "Scout to appear");
            }
        },
        verification: () => {
            const paidUnits = Math.max(0, me().getUnits().length - FREE_UNITS);
            return paidUnits > 0 && expense("Unit maintenance")?.amount === paidUnits;
        }
    });

    runner.addStep({
        name: "The status bar's rate is income minus upkeep",
        action: async () => {},
        verification: () => {
            const breakdown = me().getGoldBreakdown();
            const income = breakdown.income.reduce((total, entry) => total + entry.amount, 0);
            const upkeep = breakdown.expenses.reduce((total, entry) => total + entry.amount, 0);
            return breakdown.net === income - upkeep && me().getTotalStat("gold") === breakdown.net;
        }
    });

    runner.addStep({
        name: "Ending the turn banks exactly that rate",
        action: async () => {
            goldBefore = gold();
            turnNet = me().getGoldBreakdown().net;
            WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
            await utils.waitUntil(() => gold() === goldBefore + turnNet, 5000, "Turn's gold to be banked");
        },
        verification: () => gold() === goldBefore + turnNet
    });

    runner.addStep({
        name: "Can't afford more than the treasury holds: buying a unit with too little gold does nothing",
        action: async () => {
            // Spend down until a Scout is out of reach, then try one more.
            while (gold() >= SCOUT_PRICE) {
                const expected = gold() - SCOUT_PRICE;
                WebsocketClient.sendMessage({ event: "purchaseProductionOption", cityName: city.getName(), type: "unit", name: "Scout" });
                await utils.waitUntil(() => gold() === expected, 5000, "Scout to be paid for");
            }
            goldBefore = gold();
            unitsBefore = me().getUnits().length;
            WebsocketClient.sendMessage({ event: "purchaseProductionOption", cityName: city.getName(), type: "unit", name: "Scout" });
            await utils.delay(1000);
        },
        verification: () => gold() === goldBefore && me().getUnits().length === unitsBefore
    });

    runner.addStep({
        name: "Hovering the status bar's gold shows the breakdown",
        action: async () => {
            statusBar()["setGoldHovered"](true);
            await utils.waitUntil(() => !!statusBar()["goldTooltip"], 5000, "Gold tooltip to appear");
        },
        verification: () => !!statusBar()["goldTooltip"]
    });

    runner.addStep({
        name: "The city screen shows gold prices beside what can be bought",
        action: async () => {
            statusBar()["setGoldHovered"](false);
            WebsocketClient.sendMessage({ event: "addToProductionQueue", cityName: city.getName(), type: "unit", name: "Warrior" });
            await utils.waitUntil(() => city.getProductionQueue().length > 0, 5000, "Warrior to be queued");
            utils.getInGameScene().toggleCityUI(city);
            await utils.waitUntil(() => buyButtons().some((button) => button.getText().startsWith("Buy ")), 5000, "Buy button to appear");
            // Open the production list, to see its prices too.
            (scene()["cityDisplayInfo"] as Record<string, any>)["openChooseProduction"]();
            await utils.waitUntil(() => buyButtons().length > 1, 5000, "Production list prices to appear");
            statusBar()["setGoldHovered"](true);
        },
        verification: () => buyButtons().length > 1
    });

    return runner;
}
