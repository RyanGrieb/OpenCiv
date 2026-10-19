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
// of tiles apart on open grassland (the melee_combat map preset), each with a Warrior and a Horseman, so the
// fight starts right away. Our Warrior opens by walking up to the enemy Settler
// across a one-tile gap and capturing it in the same move, and at the end our Horseman charges an enemy
// two tiles away.
export function setupMeleeCombatTest(game: Game) {
    const runner = new TestRunner("MeleeCombat");
    const utils = new TestUtils(game);
    let enemySocket: WebSocket | undefined;
    let warrior: Unit | undefined;
    let horseman: Unit | undefined;
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
    // Open land with nothing on it but `unit`, if given.
    const isOpen = (tile: Tile, unit?: Unit) =>
        !!tile && !tile.isWater() && tile.getMovementCost() < 9999 && !tile.getCity() && tile.getUnits().every((other) => other === unit);
    const pathCost = (unit: Unit, path: Tile[]) => path.slice(1).reduce((cost, tile, i) => cost + unit.getTileWeight(path[i], tile), 0);

    // Open tiles `gap` + 1 steps from the target, from which `unit` could walk next to it and still have a move to attack with.
    const chargeTiles = (unit: Unit, target: Tile, gap: number) =>
        utils.tilesAround(target, gap + 1, gap + 1).filter(
            (start) =>
                isOpen(start, unit) &&
                target.getAdjacentTiles().some((next) => {
                    if (!isOpen(next)) return false;
                    const path = GameMap.getInstance().constructShortestPath(unit, start, next);
                    return path.length > 1 && pathCost(unit, path) < unit.getDefaultMoveDistance();
                })
        );
    const hasPathLine = () => clientPlayer()["movementLines"].some((line: { getColor(): string }) => line.getColor() !== "red");
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
            enemySocket = await utils.startGameWithSecondPlayer({ autoEndTurns: false, gameOptions: { startWithHorseman: true, mapPreset: "melee_combat", startingGold: 100 } });
        },
        verification: () => game.getCurrentScene().getName() === "in_game"
    });

    runner.addStep({
        name: "Find our Warrior and Horseman, and the enemy's Warrior and Settler",
        action: async () => {
            await utils.waitUntil(
                () => {
                    const me = utils.getClientPlayer();
                    warrior = me.getUnits().find((unit) => unit.getName() === "Warrior");
                    horseman = me.getUnits().find((unit) => unit.getName() === "Horseman");
                    const enemies = allUnits().filter((unit) => unit.getPlayer() !== me);
                    enemyWarrior = enemies.find((unit) => unit.getName() === "Warrior");
                    enemySettler = enemies.find((unit) => unit.isUtility());
                    return !!(warrior && horseman && enemyWarrior && enemySettler);
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
        name: "March to two tiles from the enemy Settler, with one open tile between them",
        action: async () => {
            await utils.walkTo(
                warrior,
                () => chargeTiles(warrior, enemySettler.getTile(), 1),
                (data) => WebsocketClient.sendMessage(data),
                endTurn
            );
            // Start the attack with a full turn's movement.
            await endTurn();
            watch(warrior);
        },
        verification: () =>
            !isAdjacent(warrior.getTile(), enemySettler.getTile()) && !!warrior.getMeleeApproach(enemySettler.getTile())?.attacksThisTurn
    });

    runner.addStep({
        name: "Aiming at the Settler across the gap draws the walk up to it, then a red line, with no preview since it can't fight back",
        action: async () => {
            aimAt(warrior, enemySettler.getTile());
            await utils.delay(1500);
        },
        verification: () => hasRedLine() && hasPathLine() && previewWindow() === undefined
    });

    runner.addStep({
        name: "Attacking across the gap walks up and captures the lone Settler as a Builder, spending all movement",
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
        name: "Neither Warrior heals without fortifying, even the one that sat out the turn",
        action: async () => {
            await endTurn();
            await utils.delay(400);
            utils.log(`After the turn: ours ${warrior.getHealth()} HP, theirs ${enemyWarrior.getHealth()} HP`, "yellow");
        },
        verification: () => enemyWarrior.getHealth() === healthBefore.theirs && warrior.getHealth() === healthBefore.ours
    });

    runner.addStep({
        name: "Fortify Until Healed shows for our wounded Warrior, which heals from the second turn on and stays fortified",
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
            // The turn it fortified on doesn't count.
            if (warrior.getHealth() !== healthBefore.ours) throw new Error("Healed on the turn it fortified");
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

    let charge: { target: Unit; health: number } | undefined;

    runner.addStep({
        name: "Our Horseman rides to three tiles from an enemy, with two tiles between them",
        action: async () => {
            const target = allUnits().find((unit) => unit.getPlayer() !== utils.getClientPlayer() && unit.canFight());
            if (!target) throw new Error("No enemy left to charge");
            charge = { target, health: target.getHealth() };

            await utils.walkTo(horseman, () => chargeTiles(horseman, target.getTile(), 2), (data) => WebsocketClient.sendMessage(data), endTurn);
            await endTurn();
            watch(horseman);
        },
        verification: () => utils.tilesAround(charge.target.getTile(), 3, 3).includes(horseman.getTile()) && !isAdjacent(horseman.getTile(), charge.target.getTile())
    });

    runner.addStep({
        name: "Aiming at it from there previews the fight, with the ride up to it drawn",
        action: async () => {
            aimAt(horseman, charge.target.getTile());
            await utils.waitUntil(() => !!previewWindow(), 5000, "Combat preview to appear");
            await utils.delay(1500);
        },
        verification: () => hasRedLine() && hasPathLine() && previewWindow() !== undefined
    });

    runner.addStep({
        name: "Attacking rides up next to the enemy and strikes in the same move",
        action: async () => {
            const targetTile = charge.target.getTile();
            attackThroughUI(horseman, targetTile);
            await utils.waitUntil(
                () => !isAlive(charge.target) || charge.target.getHealth() < charge.health,
                5000,
                "The Horseman's charge to land"
            );
            await utils.delay(500);
            watch(horseman);
        },
        verification: () => !isAlive(charge.target) || isAdjacent(horseman.getTile(), charge.target.getTile())
    });

    return runner;
}
