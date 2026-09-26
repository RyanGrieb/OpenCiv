import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { Tile } from "../../map/Tile";
import { GameMap } from "../../map/GameMap";
import { InGameScene } from "../../scene/type/InGameScene";
import { TestUtils } from "../TestUtils";

// Plays melee combat out against a live server. A second player joins from this same page over a bare
// websocket and does nothing but end turns and, near the end, strike back - so everything happens in
// front of whoever is watching, from Player1's side. The map is revealed and both players start a couple
// of tiles apart, so the fight starts right away.
export function setupMeleeCombatTest(game: Game) {
    const runner = new TestRunner("MeleeCombat");
    const utils = new TestUtils(game);
    let enemySocket: WebSocket | undefined;
    let warrior: Unit | undefined;
    let enemyWarrior: Unit | undefined;
    let enemySettler: Unit | undefined;
    let enemyWarriorTile: Tile | undefined;
    let overrunTile: Tile | undefined;
    let healthBefore = { ours: 0, theirs: 0 };
    let expected: { survivor: Unit; tile: Tile } | undefined;

    const scene = () => game.getCurrentSceneAs<InGameScene>();
    const allUnits = () => {
        const units: Unit[] = [];
        for (const column of GameMap.getInstance().getTiles()) {
            for (const tile of column ?? []) units.push(...(tile?.getUnits() ?? []));
        }
        return units;
    };
    const isAlive = (unit: Unit) => allUnits().includes(unit);
    const isAdjacent = (a: Tile, b: Tile) => a.getAdjacentTiles().includes(b);
    const watch = (unit: Unit) => scene().focusOnTile(unit.getTile(), 3);

    // Both players have to ask for the next turn before it comes.
    const endTurn = async () => {
        WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
        enemySocket.send(JSON.stringify({ event: "nextTurnRequest", value: true }));
        await utils.delay(600);
    };

    const clientPlayer = () => utils.getClientPlayer() as unknown as Record<string, any>;
    const previewWindow = () => clientPlayer()["combatPreviewWindow"];
    const hasRedLine = () => clientPlayer()["movementLines"].some((line: { getColor(): string }) => line.getColor() === "red");

    // Left-clicks the unit's tile, cycling past anything else of ours stacked there (like a captive).
    const select = (unit: Unit) => {
        for (let click = 0; click < 4 && clientPlayer()["selectedUnit"] !== unit; click++) {
            clientPlayer()["onClickedTileWithUnit"](unit.getTile());
        }
        if (clientPlayer()["selectedUnit"] !== unit) throw new Error(`Couldn't select ${unit.getName()}`);
    };

    // What a right-click drag onto the target does before the button is released.
    const aimAt = (attacker: Unit, target: Tile) => {
        watch(attacker);
        select(attacker);
        clientPlayer()["previewAttack"](target);
    };

    // The same path a player takes: select the unit, then right-click release on the target.
    const attackThroughUI = (attacker: Unit, target: Tile) => {
        select(attacker);
        clientPlayer()["moveSelectedUnit"](target);
    };

    const enemyAttack = (attacker: Unit, target: Tile) => {
        enemySocket.send(
            JSON.stringify({ event: "attackUnit", id: attacker.getID(), targetX: target.getGridX(), targetY: target.getGridY() })
        );
    };

    runner.addStep({
        name: "Start a revealed-map game against a second player",
        action: async () => {
            enemySocket = await utils.startGameWithSecondPlayer({ autoEndTurns: false });
        },
        verification: () => game.getCurrentScene().getName() === "in_game"
    });

    runner.addStep({
        name: "Find our Warrior and the enemy's Warrior and Settler",
        action: async () => {
            await utils.waitUntil(
                () => {
                    const me = utils.getClientPlayer();
                    warrior = me.getUnits().find((unit) => unit.canFight());
                    const enemies = allUnits().filter((unit) => unit.getPlayer() !== me);
                    enemyWarrior = enemies.find((unit) => unit.canFight());
                    enemySettler = enemies.find((unit) => unit.isUtility());
                    return !!(warrior && enemyWarrior && enemySettler);
                },
                10000,
                "Both players' starting units to appear"
            );
            enemyWarriorTile = enemyWarrior.getTile();
            watch(warrior);
        },
        verification: () => warrior.getCombatStrength() === 8 && warrior.getHealth() === 100 && enemyWarrior.getCombatStrength() === 8
    });

    runner.addStep({
        name: "March next to the enemy Settler",
        action: async () => {
            for (let turn = 0; turn < 40 && !isAdjacent(warrior.getTile(), enemySettler.getTile()); turn++) {
                let best: Tile[] | undefined;
                for (const tile of enemySettler.getTile().getAdjacentTiles()) {
                    if (!tile || tile.isWater() || tile.getUnits().length > 0) continue;
                    const path = GameMap.getInstance().constructShortestPath(warrior, warrior.getTile(), tile);
                    if (path.length > 1 && (!best || path.length < best.length)) best = path;
                }
                if (!best) throw new Error("No open tile next to the enemy Settler can be reached");

                const target = best[best.length - 1];
                WebsocketClient.sendMessage({
                    event: "moveUnit",
                    unitX: warrior.getTile().getGridX(),
                    unitY: warrior.getTile().getGridY(),
                    id: warrior.getID(),
                    targetX: target.getGridX(),
                    targetY: target.getGridY()
                });
                await utils.delay(300);
                watch(warrior);
                await endTurn();
            }
            // Start the attack with a full turn's movement.
            await endTurn();
        },
        verification: () => isAdjacent(warrior.getTile(), enemySettler.getTile())
    });

    runner.addStep({
        name: "Aiming at the Settler draws a red line, with no preview since it can't fight back",
        action: async () => {
            aimAt(warrior, enemySettler.getTile());
            await utils.delay(1500);
        },
        verification: () => hasRedLine() && previewWindow() === undefined
    });

    runner.addStep({
        name: "Attacking a lone Settler captures it as a Builder and moves in, spending all movement",
        action: async () => {
            overrunTile = enemySettler.getTile();
            attackThroughUI(warrior, overrunTile);
            await utils.waitUntil(() => !isAlive(enemySettler), 5000, "Settler to change hands");
            await utils.delay(500);
            watch(warrior);
        },
        verification: () => {
            const captive = overrunTile.getUnits().find((unit) => unit.isUtility());
            return (
                !previewWindow() &&
                warrior.getTile() === overrunTile &&
                warrior.getAvailableMovement() === 0 &&
                captive?.getName() === "Builder" &&
                captive.getPlayer() === utils.getClientPlayer() &&
                captive.getAvailableMovement() === 0
            );
        }
    });

    runner.addStep({
        name: "A second attack in the same turn is refused, even when sent straight to the server",
        action: async () => {
            WebsocketClient.sendMessage({
                event: "attackUnit",
                id: warrior.getID(),
                targetX: enemyWarriorTile.getGridX(),
                targetY: enemyWarriorTile.getGridY()
            });
            await utils.delay(800);
        },
        verification: () =>
            isAdjacent(warrior.getTile(), enemyWarriorTile) &&
            !warrior.canMeleeAttack(enemyWarriorTile) &&
            warrior.getHealth() === 100 &&
            enemyWarrior.getHealth() === 100
    });

    runner.addStep({
        name: "Next turn, aiming at the enemy Warrior previews the fight",
        action: async () => {
            await endTurn();
            aimAt(warrior, enemyWarriorTile);
            await utils.waitUntil(() => !!previewWindow(), 5000, "Combat preview to appear");
            await utils.delay(1500); // Long enough for whoever's watching to read it
        },
        verification: () => hasRedLine() && previewWindow() !== undefined
    });

    runner.addStep({
        name: "Attacking the enemy Warrior damages both sides",
        action: async () => {
            attackThroughUI(warrior, enemyWarriorTile);
            await utils.waitUntil(() => warrior.getHealth() < 100 && enemyWarrior.getHealth() < 100, 5000, "Both Warriors to take damage");
            utils.log(`After the attack: ours ${warrior.getHealth()} HP, theirs ${enemyWarrior.getHealth()} HP`, "yellow");
            healthBefore = { ours: warrior.getHealth(), theirs: enemyWarrior.getHealth() };
        },
        verification: () => warrior.getTile() === overrunTile && enemyWarrior.getTile() === enemyWarriorTile && warrior.getAvailableMovement() === 0
    });

    runner.addStep({
        name: "A unit that sat out the turn heals 10 HP; one that attacked doesn't",
        action: async () => {
            await endTurn();
            await utils.delay(400);
            utils.log(`After the turn: ours ${warrior.getHealth()} HP, theirs ${enemyWarrior.getHealth()} HP`, "yellow");
        },
        verification: () => enemyWarrior.getHealth() === Math.min(100, healthBefore.theirs + 10) && warrior.getHealth() === healthBefore.ours
    });

    runner.addStep({
        name: "Fortify Until Healed shows for our wounded Warrior, which then heals and stays fortified",
        action: async () => {
            const action = warrior.getActions().find((candidate) => candidate.getName() === "fortify_until_healed");
            if (!action?.requirementsMet(warrior)) throw new Error("No usable Fortify Until Healed action");

            // What the action button in the unit info sends.
            select(warrior);
            WebsocketClient.sendMessage({
                event: "unitAction",
                unitX: warrior.getTile().getGridX(),
                unitY: warrior.getTile().getGridY(),
                id: warrior.getID(),
                actionName: action.getName()
            });
            await utils.waitUntil(() => warrior.isFortified(), 5000, "Warrior to fortify");
            healthBefore.ours = warrior.getHealth();
            await endTurn();
            await utils.delay(400);
            utils.log(`Fortified: ours ${healthBefore.ours} -> ${warrior.getHealth()} HP`, "yellow");
        },
        verification: () =>
            warrior.isFortified() &&
            warrior.getHealth() === Math.min(100, healthBefore.ours + 10) &&
            !warrior.getActions().some((action) => action.getName() === "fortify_until_healed" && action.requirementsMet(warrior))
    });

    runner.addStep({
        name: "Fight to the death: a winning attacker advances, a winning defender holds",
        action: async () => {
            // Trades blows until someone falls, then records which tile the survivor should be on.
            const strike = async (attacker: Unit, defender: Unit, send: () => void) => {
                const attackerTile = attacker.getTile();
                const defenderTile = defender.getTile();
                send();
                await utils.delay(700);
                if (!isAlive(defender)) expected = { survivor: attacker, tile: defenderTile };
                else if (!isAlive(attacker)) expected = { survivor: defender, tile: defenderTile };
                else if (attacker.getTile() !== attackerTile) throw new Error("Attacker moved without a kill");
            };

            for (let turn = 0; turn < 15 && !expected; turn++) {
                await strike(warrior, enemyWarrior, () => attackThroughUI(warrior, enemyWarrior.getTile()));
                if (!expected) await strike(enemyWarrior, warrior, () => enemyAttack(enemyWarrior, warrior.getTile()));

                const hp = (unit: Unit) => (isAlive(unit) ? `${unit.getHealth()} HP` : "dead");
                utils.log(`Round ${turn + 1}: ours ${hp(warrior)}, theirs ${hp(enemyWarrior)}`, "yellow");
                if (!expected) await endTurn();
            }
            if (expected) watch(expected.survivor);
        },
        // Attacking wakes a fortified unit.
        verification: () =>
            !!expected && isAlive(expected.survivor) && expected.survivor.getTile() === expected.tile && !expected.survivor.isFortified()
    });

    return runner;
}
