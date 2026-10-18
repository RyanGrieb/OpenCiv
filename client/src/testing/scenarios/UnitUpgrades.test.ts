import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { Unit } from "../../Unit";
import { Tile } from "../../map/Tile";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { TestUtils } from "../TestUtils";
import { InGameScene } from "../../scene/type/InGameScene";

// Unit upgrades along every line. Every tech is researched, you have 10000 gold, and the first unit of each
// upgrade line (Warrior, Spearman, Horseman, Chariot Archer, Archer, Catapult, Trireme, Caravel, Submarine)
// starts with 15 XP inside where two new cities' borders will be. The scenario founds both cities, then
// presses Upgrade on every unit each turn until each line reaches its last unit, checking the gold, XP and
// health carry over. An upgraded unit can't move until next turn, so the longest line takes seven turns.
export function setupUnitUpgradesTest(game: Game) {
    const runner = new TestRunner("UnitUpgrades");
    const utils = new TestUtils(game);
    const STARTING_XP = 15;
    const LAST_UNITS: Record<string, string> = {
        Warrior: "Mechanized Infantry",
        Spearman: "Mechanized Infantry",
        Horseman: "Modern Armor",
        "Chariot Archer": "Modern Armor",
        Archer: "Bazooka",
        Catapult: "Rocket Artillery",
        Trireme: "Missile Cruiser",
        Caravel: "Missile Cruiser",
        Submarine: "Nuclear Submarine"
    };
    // Each line's starting tile, and the names its unit has had so far.
    const lines = new Map<Tile, string[]>();
    let goldAtStart = 0;
    let turnStarted = false;

    const gold = () => utils.getClientPlayer().getAccumulatedStat("gold");
    const unitOn = (tile: Tile): Unit | undefined =>
        tile.getUnits().find((unit) => unit.getPlayer() === utils.getClientPlayer() && unit.canFight());
    const canUpgrade = (unit: Unit | undefined) =>
        !!unit?.getActions().some((action) => action.getName() === "upgrade" && action.requirementsMet(unit));
    const sendAction = (unit: Unit, actionName: string) =>
        WebsocketClient.sendMessage({
            event: "unitAction",
            unitX: unit.getTile().getGridX(),
            unitY: unit.getTile().getGridY(),
            id: unit.getID(),
            actionName
        });

    runner.addStep({
        name: "Start with every tech, 10000 gold, two Settlers and one unit of each upgrade line",
        action: async () => {
            await utils.ensureInGame({
                allowBarbarians: false,
                numCityStates: 0,
                mapPreset: "unit_upgrades",
                startWithAllTechs: true,
                startingGold: 10000,
                startingExperience: STARTING_XP
            });
            NetworkEvents.on({
                eventName: "newTurn",
                parentObject: runner,
                callback: () => {
                    turnStarted = true;
                }
            });
            await utils.waitUntil(
                () => Object.keys(LAST_UNITS).every((name) => utils.getClientPlayer()?.getUnits().some((unit) => unit.getName() === name)),
                10000,
                "Every line's first unit to appear"
            );
        },
        verification: () => true
    });

    runner.addStep({
        name: "Found both cities, so every unit stands in your territory",
        action: async () => {
            const settlers = utils.getClientPlayer().getUnits().filter((unit) => unit.getName() === "Settler");
            settlers.forEach((settler) => sendAction(settler, "settle"));
            await utils.waitUntil(() => utils.getClientPlayer().getCities().length === 2, 5000, "Both cities to be founded");

            utils
                .getClientPlayer()
                .getUnits()
                .filter((unit) => LAST_UNITS[unit.getName()])
                .forEach((unit) => lines.set(unit.getTile(), [unit.getName()]));
            game.getCurrentSceneAs<InGameScene>().focusOnTile([...lines.keys()][0], 3);
            goldAtStart = gold();
        },
        verification: () => lines.size === Object.keys(LAST_UNITS).length
    });

    runner.addStep({
        name: "Upgrade every unit each turn until each line reaches its last unit",
        action: async () => {
            for (let turn = 1; turn <= 10; turn++) {
                // Upgrade buttons arrive once the server sees the gold, territory and movement for them.
                await utils.delay(1000);
                const ready = [...lines.entries()].filter(([tile]) => canUpgrade(unitOn(tile)));
                if (ready.length === 0) break;

                for (const [tile, names] of ready) {
                    const unit = unitOn(tile);
                    const desc = unit.getActions().find((action) => action.getName() === "upgrade").getDesc();
                    sendAction(unit, "upgrade");
                    await utils.waitUntil(() => unitOn(tile) && unitOn(tile) !== unit, 3000, `${unit.getName()} to upgrade`);
                    names.push(unitOn(tile).getName());
                    utils.log(`Turn ${turn}: ${unit.getName()} - ${desc}`, "yellow");
                }

                turnStarted = false;
                WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
                await utils.waitUntil(() => turnStarted, 10000, "The next turn to start");
            }
            [...lines.values()].forEach((names) => utils.log(names.join(" -> "), "white"));
        },
        verification: () =>
            [...lines.entries()].every(([tile, names]) => unitOn(tile)?.getName() === LAST_UNITS[names[0]])
    });

    runner.addStep({
        name: "Upgraded units kept their XP and health, and the upgrades cost gold",
        action: async () => {
            utils.log(`Gold: ${goldAtStart} before upgrading, ${gold()} after.`, "yellow");
        },
        verification: () =>
            gold() < goldAtStart &&
            [...lines.keys()].every((tile) => {
                const unit = unitOn(tile);
                return unit.getPromotionData().experience === STARTING_XP && unit.getHealth() === Unit.MAX_HEALTH;
            })
    });

    runner.addStep({
        name: "Your turn",
        action: async () => {
            utils.log("Every line is at its last unit. Select one to see it has no Upgrade button left,", "yellow");
            utils.log("and that its XP bar still shows the 15 XP the first unit started with.", "yellow");

            // Let clicks through to the map wherever this log sits.
            const results = document.getElementById("test-results");
            if (results) results.style.pointerEvents = "none";
        },
        verification: () => true
    });

    return runner;
}
