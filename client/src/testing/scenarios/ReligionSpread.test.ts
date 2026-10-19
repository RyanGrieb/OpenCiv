import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { City } from "../../city/City";
import { GameMap } from "../../map/GameMap";
import { CityReligionTooltip } from "../../ui/hud/CityReligionTooltip";
import { TestUtils } from "../TestUtils";

const PANTHEON_COST = 10;
const PROPHET_COST = 200;
const RELIGION = "Islam";
// Pressure from the holy city (12 a turn) converts a citizen for every 60: the neighbour's one citizen
// in 5 turns.
const TURNS_TO_CONVERT = 5;
const PILGRIMAGE_FAITH = 2;

// Spreads a religion to another civilization against a live server. Both players found a city three
// tiles apart; the second player joins over a bare websocket. We found a pantheon, end the turn for a
// Great Prophet, and found Islam with Pilgrimage in our city, its holy city, whose name gets Islam's
// icon. Over the next turns the holy city's pressure converts the neighbour's citizen, so its city
// follows Islam too: its name gets the icon, hovering it lists the followers, and Pilgrimage pays us
// 2 Faith for the foreign city following.
export function setupReligionSpreadTest(game: Game) {
    const runner = new TestRunner("ReligionSpread");
    const utils = new TestUtils(game);
    let enemySocket: WebSocket | undefined;
    let myCity: City | undefined;
    let enemyCity: City | undefined;

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
    const pilgrimage = () => me().getFaithBreakdown().income.find((entry) => entry.source === "Pilgrimage")?.amount;

    const endTurn = async () => {
        WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
        enemySocket.send(JSON.stringify({ event: "nextTurnRequest", value: true }));
        await utils.delay(800);
    };
    const sendAsUs = (data: Record<string, unknown>) => WebsocketClient.sendMessage(data);
    const sendAsEnemy = (data: Record<string, unknown>) => enemySocket.send(JSON.stringify(data));
    const settle = (unit: Unit, send: (data: Record<string, unknown>) => void) =>
        send({
            event: "unitAction",
            unitX: unit.getTile().getGridX(),
            unitY: unit.getTile().getGridY(),
            id: unit.getID(),
            actionName: "settle"
        });

    runner.addStep({
        name: `Start a revealed-map game at peace with a second player, with ${PANTHEON_COST + PROPHET_COST} Faith each`,
        action: async () => {
            enemySocket = await utils.startGameWithSecondPlayer({
                autoEndTurns: false,
                gameOptions: { startAtWar: false, startingFaith: PANTHEON_COST + PROPHET_COST }
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
            await utils.waitUntil(() => me().getAccumulatedStat("faith") <= PROPHET_COST, 5000, "The pantheon to be founded");
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

    return runner;
}
