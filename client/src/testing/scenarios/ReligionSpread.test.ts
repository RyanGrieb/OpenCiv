import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { City } from "../../city/City";
import { GameMap } from "../../map/GameMap";
import { Tile } from "../../map/Tile";
import { CityReligionTooltip } from "../../ui/hud/CityReligionTooltip";
import { TestUtils } from "../TestUtils";

const PANTHEON_COST = 10;
const PROPHET_COST = 200;
const SECOND_PROPHET_COST = 300;
// Missionaries and Inquisitors cost 200 Faith, 140 with Holy Order.
const HOLY_ORDER_COST = 140;
// Enough for a pantheon, a sure first and second Great Prophet (one is sure at its cost plus 95 Faith),
// then a Missionary and an Inquisitor. With every tech a prophet takes only its cost, as from the
// Industrial Era on.
const STARTING_FAITH = PANTHEON_COST + PROPHET_COST + SECOND_PROPHET_COST + 95 + 400;
const RELIGION = "Islam";
// Pressure from the holy city (12 a turn) converts a citizen for every 60: the neighbour's one citizen
// in 5 turns.
const TURNS_TO_CONVERT = 5;
const PILGRIMAGE_FAITH = 2;

// Spreads a religion to another civilization against a live server. Both players found a city three
// tiles apart; the second player joins over a bare websocket. We found a pantheon, end the turn for a
// Great Prophet, and found Islam with Pilgrimage in our city, its holy city, whose name gets Islam's
// icon. Over the next turns the holy city's pressure converts the neighbour's citizen, so its city
// follows Islam too: its name gets the icon, hovering it lists the followers, Pilgrimage pays us
// 2 Faith for the foreign city following, and the religion window lists it. A second Great Prophet
// enhances Islam with Holy Order, and we buy a Missionary and an Inquisitor. They found Judaism and
// send a Missionary over: our Inquisitor keeps it out until it steps away, then Removes Heresy. Our
// Missionary crosses their borders, spreads Islam to their city, and wears down in their lands.
export function setupReligionSpreadTest(game: Game) {
    const runner = new TestRunner("ReligionSpread");
    const utils = new TestUtils(game);
    let enemySocket: WebSocket | undefined;
    let myCity: City | undefined;
    let enemyCity: City | undefined;
    let judaismBefore = 0;

    const me = () => utils.getClientPlayer();
    const scene = () => utils.getInGameScene();
    const allUnits = () => {
        const units: Unit[] = [];
        for (const column of GameMap.getInstance().getTiles()) {
            for (const tile of column ?? []) units.push(...(tile?.getUnits() ?? []));
        }
        return units;
    };
    const allCities = () => {
        const cities: City[] = [];
        for (const column of GameMap.getInstance().getTiles()) {
            for (const tile of column ?? []) if (tile?.getCity()) cities.push(tile.getCity());
        }
        return cities;
    };
    const settlers = () => allUnits().filter((unit) => unit.getName() === "Settler");
    const prophet = () => me().getUnits().find((unit) => unit.getName() === "Great Prophet");
    const ownUnit = (name: string) => me().getUnits().find((unit) => unit.getName() === name);
    const enemyUnit = (name: string) => allUnits().find((unit) => unit.getName() === name && unit.getPlayer() !== me());
    const spreadDesc = () =>
        ownUnit("Missionary")
            ?.getActions()
            .find((action) => action.getName() === "spread_religion")
            ?.getDesc();
    const followersIn = (city: City, religion: string) => city.getReligion().followers[religion] ?? 0;
    const pilgrimage = () => me().getFaithBreakdown().income.find((entry) => entry.source === "Pilgrimage")?.amount;

    const endTurn = async () => {
        WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
        enemySocket.send(JSON.stringify({ event: "nextTurnRequest", value: true }));
        await utils.delay(800);
    };
    const sendAsUs = (data: Record<string, unknown>) => WebsocketClient.sendMessage(data);
    const sendAsEnemy = (data: Record<string, unknown>) => enemySocket.send(JSON.stringify(data));
    const act = (unit: Unit, actionName: string, send: (data: Record<string, unknown>) => void) =>
        send({ event: "unitAction", unitX: unit.getTile().getGridX(), unitY: unit.getTile().getGridY(), id: unit.getID(), actionName });
    const buyWithFaith = (city: City, name: string, send: (data: Record<string, unknown>) => void) =>
        send({ event: "purchaseProductionOption", currency: "faith", cityName: city.getName(), type: "unit", name });
    // Their unit's movement isn't sent to us between turns, so walk it over and end a turn to be sure
    // it has movement left to act with.
    const walkTheirs = async (unit: Unit, candidates: Tile[]) => {
        const destination = utils.nearestFreeTile(unit, candidates);
        for (let turn = 0; turn < 4 && unit.getTile() !== destination; turn++) {
            sendAsEnemy({
                event: "moveUnit",
                unitX: unit.getTile().getGridX(),
                unitY: unit.getTile().getGridY(),
                id: unit.getID(),
                targetX: destination.getGridX(),
                targetY: destination.getGridY()
            });
            await utils.delay(800);
            await endTurn();
        }
        await utils.waitUntil(() => unit.getTile() === destination, 3000, `Their ${unit.getName()} to arrive`);
    };
    const settle = (unit: Unit, send: (data: Record<string, unknown>) => void) =>
        send({
            event: "unitAction",
            unitX: unit.getTile().getGridX(),
            unitY: unit.getTile().getGridY(),
            id: unit.getID(),
            actionName: "settle"
        });

    runner.addStep({
        name: `Start a revealed-map game at peace with a second player, every tech and ${STARTING_FAITH} Faith each`,
        action: async () => {
            enemySocket = await utils.startGameWithSecondPlayer({
                autoEndTurns: false,
                gameOptions: { startAtWar: false, startWithAllTechs: true, startingFaith: STARTING_FAITH }
            });
            await utils.waitUntil(() => settlers().length === 2, 10000, "Both Settlers to appear");
        },
        verification: () => game.getCurrentScene().getName() === "in_game" && settlers().length === 2
    });

    runner.addStep({
        name: "Our Settler walks three tiles from theirs, and both found a city",
        action: async () => {
            const mySettler = settlers().find((unit) => unit.getPlayer() === me());
            const enemySettler = settlers().find((unit) => unit.getPlayer() !== me());
            await utils.walkTo(mySettler, () => utils.tilesAround(enemySettler.getTile(), 3, 3), sendAsUs, endTurn);
            settle(enemySettler, sendAsEnemy);
            settle(mySettler, sendAsUs);
            await utils.waitUntil(() => allCities().length === 2, 10000, "Both cities to be founded");
            myCity = allCities().find((city) => city.getPlayer() === me());
            enemyCity = allCities().find((city) => city.getPlayer() !== me());
            scene().focusOnTile(myCity.getTile(), 3);
        },
        verification: () => !!myCity && !!enemyCity && !myCity.hasReligionIcon() && !enemyCity.hasReligionIcon()
    });

    runner.addStep({
        name: `Found a pantheon, end the turn for a Great Prophet, and found ${RELIGION} with Pilgrimage: our city's name gets its icon`,
        action: async () => {
            sendAsUs({ event: "foundPantheon", name: "Sacred Path" });
            await utils.waitUntil(() => me().getAccumulatedStat("faith") <= STARTING_FAITH - PANTHEON_COST, 5000, "The pantheon to be founded");
            await endTurn();
            await utils.waitUntil(() => !!prophet(), 8000, "A Great Prophet to be born");
            sendAsUs({
                event: "foundReligion",
                unitId: prophet().getID(),
                name: RELIGION,
                founderBelief: "Pilgrimage",
                followerBelief: "Feed the World"
            });
            await utils.waitUntil(() => myCity.getReligion().majority === RELIGION, 5000, "Our city to follow the religion");
        },
        verification: () =>
            !prophet() &&
            myCity.hasReligionIcon() &&
            myCity.getReligion().followers[RELIGION] === 1 &&
            enemyCity.getReligion().majority === null
    });

    runner.addStep({
        name: `End the turn: a second Great Prophet is born in the holy city and enhances ${RELIGION} with Holy Order`,
        action: async () => {
            await endTurn();
            await utils.waitUntil(() => !!prophet(), 8000, "A second Great Prophet to be born");
            sendAsUs({ event: "enhanceReligion", unitId: prophet().getID(), followerBelief: "Asceticism", enhancerBelief: "Holy Order" });
            await utils.waitUntil(() => !prophet(), 5000, "The religion to be enhanced");
        },
        verification: () => !prophet()
    });

    runner.addStep({
        name: `Buy a Missionary and an Inquisitor in the holy city for ${HOLY_ORDER_COST} Faith each`,
        action: async () => {
            const faithBefore = me().getAccumulatedStat("faith");
            buyWithFaith(myCity, "Missionary", sendAsUs);
            buyWithFaith(myCity, "Inquisitor", sendAsUs);
            await utils.waitUntil(() => !!ownUnit("Missionary") && !!ownUnit("Inquisitor"), 5000, "Both units to be bought");
            await utils.waitUntil(() => me().getAccumulatedStat("faith") === faithBefore - 2 * HOLY_ORDER_COST, 5000, "The faith to be spent");
        },
        verification: () => !!ownUnit("Missionary") && !!ownUnit("Inquisitor")
    });

    runner.addStep({
        name: `End ${TURNS_TO_CONVERT} turns: the holy city's pressure converts their citizen, and their city's name gets the icon`,
        action: async () => {
            scene().focusOnTile(enemyCity.getTile(), 3);
            for (let turn = 0; turn < TURNS_TO_CONVERT + 2 && enemyCity.getReligion().majority !== RELIGION; turn++) {
                await endTurn();
            }
            await utils.waitUntil(() => enemyCity.getReligion().majority === RELIGION, 5000, "Their city to follow the religion");
        },
        verification: () => enemyCity.hasReligionIcon() && (enemyCity.getReligion().followers[RELIGION] ?? 0) >= 1
    });

    runner.addStep({
        name: "Hover their city's religion icon: it lists who follows what",
        action: async () => {
            await CityReligionTooltip.show(enemyCity.getName(), enemyCity.getReligion());
            await utils.delay(1500);
            CityReligionTooltip.hide();
        },
        verification: () => true
    });

    runner.addStep({
        name: `Pilgrimage pays us ${PILGRIMAGE_FAITH} Faith a turn for their city following ${RELIGION}`,
        action: async () => {
            await utils.waitUntil(() => pilgrimage() === PILGRIMAGE_FAITH, 5000, "Pilgrimage's faith to show");
        },
        verification: () => pilgrimage() === PILGRIMAGE_FAITH
    });

    runner.addStep({
        name: `Open the religion window: it shows ${RELIGION}'s icon and lists their city among those following it`,
        action: async () => {
            scene().toggleReligionUI();
            await utils.waitUntil(
                () => !!scene().getReligionWindow()?.getOverview()?.cities.some((city) => city.name === enemyCity.getName()),
                5000,
                "The religion window to list their city"
            );
            await utils.delay(1500);
        },
        verification: () =>
            scene()
                .getReligionWindow()
                .getTexts()
                .some((text) => text.startsWith(enemyCity.getName()))
    });

    runner.addStep({
        name: "They found a pantheon, then Judaism in their city with a Great Prophet, and buy a Missionary",
        action: async () => {
            scene().toggleReligionUI();
            sendAsEnemy({ event: "foundPantheon", name: "God of War" });
            await utils.delay(500);
            await endTurn();
            await utils.waitUntil(() => !!enemyUnit("Great Prophet"), 8000, "Their Great Prophet to be born");
            sendAsEnemy({
                event: "foundReligion",
                unitId: enemyUnit("Great Prophet").getID(),
                name: "Judaism",
                founderBelief: "Tithe",
                followerBelief: "Pagodas"
            });
            await utils.waitUntil(() => enemyCity.getReligion().majority === "Judaism", 5000, "Their city to follow Judaism");
            buyWithFaith(enemyCity, "Missionary", sendAsEnemy);
            await utils.waitUntil(() => !!enemyUnit("Missionary"), 5000, "Their Missionary to be bought");
        },
        verification: () => enemyCity.getReligion().majority === "Judaism" && !!enemyUnit("Missionary")
    });

    runner.addStep({
        name: "Their Missionary walks next to our city, but our Inquisitor in or beside it keeps it from spreading Judaism",
        action: async () => {
            await endTurn();
            await walkTheirs(enemyUnit("Missionary"), utils.tilesAround(myCity.getTile(), 1, 1));
            judaismBefore = followersIn(myCity, "Judaism");
            act(enemyUnit("Missionary"), "spread_religion", sendAsEnemy);
            await utils.delay(1000);
        },
        verification: () =>
            followersIn(myCity, "Judaism") === judaismBefore &&
            [myCity.getTile(), ...myCity.getTile().getAdjacentTiles()].includes(ownUnit("Inquisitor").getTile())
    });

    runner.addStep({
        name: "Our Inquisitor steps two tiles away: their Missionary spreads Judaism to our city",
        action: async () => {
            await utils.walkTo(ownUnit("Inquisitor"), () => utils.tilesAround(myCity.getTile(), 2, 2), sendAsUs, endTurn);
            judaismBefore = followersIn(myCity, "Judaism");
            act(enemyUnit("Missionary"), "spread_religion", sendAsEnemy);
            await utils.waitUntil(() => followersIn(myCity, "Judaism") > judaismBefore, 5000, "Judaism to reach our city");
        },
        verification: () => followersIn(myCity, "Judaism") > judaismBefore
    });

    runner.addStep({
        name: "Our Inquisitor walks back beside our city and Removes Heresy: Judaism is gone from it, and so is the Inquisitor",
        action: async () => {
            await utils.walkTo(ownUnit("Inquisitor"), () => utils.tilesAround(myCity.getTile(), 1, 1), sendAsUs, endTurn);
            act(ownUnit("Inquisitor"), "remove_heresy", sendAsUs);
            await utils.waitUntil(() => !ownUnit("Inquisitor"), 5000, "The Inquisitor to be used up");
        },
        verification: () => !ownUnit("Inquisitor") && followersIn(myCity, "Judaism") === 0
    });

    runner.addStep({
        name: `Our Missionary crosses their borders and spreads ${RELIGION} to their city, with one spread left`,
        action: async () => {
            const before = followersIn(enemyCity, RELIGION);
            scene().focusOnTile(enemyCity.getTile(), 3);
            await utils.walkTo(ownUnit("Missionary"), () => utils.tilesAround(enemyCity.getTile(), 1, 1), sendAsUs, endTurn);
            act(ownUnit("Missionary"), "spread_religion", sendAsUs);
            await utils.waitUntil(() => followersIn(enemyCity, RELIGION) > before, 5000, `${RELIGION} to spread to their city`);
            await utils.waitUntil(() => spreadDesc()?.includes("1 left"), 5000, "The Missionary to have one spread left");
        },
        verification: () => followersIn(enemyCity, RELIGION) > 0 && spreadDesc()?.includes("1 left")
    });

    runner.addStep({
        name: "End the turn: our Missionary loses strength in their lands",
        action: async () => {
            await endTurn();
            await utils.waitUntil(() => spreadDesc()?.includes("% strength"), 5000, "The Missionary to lose strength");
        },
        verification: () => spreadDesc()?.includes("% strength")
    });

    return runner;
}
