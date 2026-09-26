import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { Tile } from "../../map/Tile";
import { GameMap } from "../../map/GameMap";
import { InGameScene } from "../../scene/type/InGameScene";
import { CombatPreviewEvent } from "../../ui/hud/CombatPreviewWindow";
import { Label } from "../../ui/components/Label";
import { TestUtils } from "../TestUtils";

// Plays ranged combat out against a live server, from Player1's side. Both players start with an Archer
// (the startWithArcher game option) a couple of tiles apart; the second player joins over a bare
// websocket and does nothing but end turns, so its Warrior is a sitting target.
export function setupRangedCombatTest(game: Game) {
    const runner = new TestRunner("RangedCombat");
    const utils = new TestUtils(game);
    const listener = {};
    let enemySocket: WebSocket | undefined;
    let archer: Unit | undefined;
    let enemyWarrior: Unit | undefined;
    let archerTile: Tile | undefined;
    let enemyHealthBefore = 100;
    let lastPreview: CombatPreviewEvent | undefined;

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

    const endTurn = async () => {
        WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
        enemySocket.send(JSON.stringify({ event: "nextTurnRequest", value: true }));
        await utils.delay(600);
    };

    const clientPlayer = () => utils.getClientPlayer() as unknown as Record<string, any>;
    const aiming = () => clientPlayer()["rangedAiming"] as Record<string, any>;
    const previewWindow = () => clientPlayer()["combatPreviewWindow"];
    const hasRedLine = () => clientPlayer()["movementLines"].some((line: { getColor(): string }) => line.getColor() === "red");
    const canShootWarrior = () => aiming().canShoot(enemyWarrior.getTile());

    // Selecting a ranged unit asks the server where it can shoot; waits for the answer. Retried, since
    // a window opening early in the game (unselecting every unit) can swallow the first selection.
    const select = async (unit: Unit) => {
        for (let attempt = 0; attempt < 5; attempt++) {
            if (clientPlayer()["selectedUnit"] === unit) clientPlayer().unselectUnit();
            clientPlayer().selectUnit(unit);
            await utils.delay(1000);
            if (aiming()["targetTiles"].length > 0) return;
        }
        throw new Error("No ranged targets from the server");
    };

    // What the Ranged Attack button in the unit info sends.
    const pressRangedAttack = async () => {
        WebsocketClient.sendMessage({
            event: "unitAction",
            unitX: archer.getTile().getGridX(),
            unitY: archer.getTile().getGridY(),
            id: archer.getID(),
            actionName: "ranged_attack"
        });
        await utils.waitUntil(() => aiming().isAiming(), 5000, "Aiming to start");
    };

    // A real key press, the way the browser delivers it.
    const pressB = async () => {
        document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));
        document.body.dispatchEvent(new KeyboardEvent("keyup", { key: "b" }));
        await utils.delay(800);
    };

    const hover = (tile: Tile) => {
        clientPlayer()["hoveredTile"].setRepresentedTile(tile);
        clientPlayer()["updateAimedTarget"]();
    };

    // An open tile two steps from the enemy Warrior that the Archer can walk to, nearest first.
    const findFiringSpot = (): Tile[] | undefined => {
        const warriorTile = enemyWarrior.getTile();
        let best: Tile[] | undefined;
        for (const neighbor of warriorTile.getAdjacentTiles()) {
            for (const tile of neighbor?.getAdjacentTiles() ?? []) {
                if (!tile || tile === warriorTile || isAdjacent(tile, warriorTile)) continue;
                if (tile.isWater() || tile.getUnits().length > 0) continue;

                const path = GameMap.getInstance().constructShortestPath(archer, archer.getTile(), tile);
                if (path.length > 1 && (!best || path.length < best.length)) best = path;
            }
        }
        return best;
    };

    runner.addStep({
        name: "Start a revealed-map game where both players have an Archer",
        action: async () => {
            enemySocket = await utils.startGameWithSecondPlayer({
                autoEndTurns: false,
                gameOptions: { startWithArcher: true }
            });
        },
        verification: () => game.getCurrentScene().getName() === "in_game"
    });

    runner.addStep({
        name: "Our Archer has Strength 5, Ranged 7, Range 2 and a Ranged Attack action",
        action: async () => {
            await utils.waitUntil(
                () => {
                    const me = utils.getClientPlayer();
                    archer = me.getUnits().find((unit) => unit.getName() === "Archer");
                    enemyWarrior = allUnits().find((unit) => unit.getPlayer() !== me && unit.getName() === "Warrior");
                    return !!(archer && enemyWarrior);
                },
                10000,
                "Our Archer and the enemy Warrior to appear"
            );
            watch(archer);
            await select(archer);
            await utils.delay(1000); // Long enough to read the unit info
        },
        verification: () => {
            const info = archer["unitDisplayInfo"];
            const labels = info.getActors().filter((actor: unknown) => actor instanceof Label).map((label: Label) => label.getText());
            return (
                archer.getCombatStrength() === 5 &&
                archer.getRangedStrength() === 7 &&
                archer.getRange() === 2 &&
                labels.includes("Ranged: 7") &&
                archer.getActions().some((action) => action.getName() === "ranged_attack" && action.requirementsMet(archer))
            );
        }
    });

    runner.addStep({
        name: "Walk the Archer to a spot two tiles from the enemy Warrior with a clear shot",
        action: async () => {
            for (let turn = 0; turn < 30; turn++) {
                await select(archer);
                if (canShootWarrior() && !isAdjacent(archer.getTile(), enemyWarrior.getTile())) break;

                const path = findFiringSpot();
                if (!path) throw new Error("No open tile two steps from the enemy Warrior can be reached");
                const target = path[path.length - 1];
                WebsocketClient.sendMessage({
                    event: "moveUnit",
                    unitX: archer.getTile().getGridX(),
                    unitY: archer.getTile().getGridY(),
                    id: archer.getID(),
                    targetX: target.getGridX(),
                    targetY: target.getGridY()
                });
                await utils.delay(300);
                watch(archer);
                await endTurn();
            }
            await select(archer);
            archerTile = archer.getTile();
        },
        verification: () =>
            canShootWarrior() && !isAdjacent(archer.getTile(), enemyWarrior.getTile()) && archer.getAvailableMovement() > 0
    });

    runner.addStep({
        name: "Ranged Attack tints every tile in range, the Warrior's included",
        action: async () => {
            watch(archer);
            await pressRangedAttack();
            await utils.delay(1500);
        },
        verification: () =>
            aiming()["overlays"].length === aiming()["targetTiles"].length &&
            aiming()["targetTiles"].includes(enemyWarrior.getTile())
    });

    runner.addStep({
        name: "Hovering the Warrior previews the shot: the Archer takes no damage",
        action: async () => {
            // Registered once in game - the scene change clears network listeners.
            NetworkEvents.on<CombatPreviewEvent>({
                eventName: "combatPreview",
                parentObject: listener,
                callback: (data) => (lastPreview = data)
            });
            hover(enemyWarrior.getTile());
            await utils.waitUntil(() => !!previewWindow(), 5000, "Combat preview to appear");
            utils.log(
                `Preview: ${lastPreview?.outcome}, Warrior loses ${lastPreview?.defenderDamage.min}-${lastPreview?.defenderDamage.max}, Archer loses ${lastPreview?.attackerDamage.max}`,
                "yellow"
            );
            await utils.delay(2000); // Long enough for whoever's watching to read it
        },
        verification: () =>
            hasRedLine() &&
            lastPreview?.ranged === true &&
            lastPreview.attackerDamage.max === 0 &&
            lastPreview.defenderDamage.min > 0
    });

    runner.addStep({
        name: "Left-clicking the Warrior shoots it: only the Warrior is hurt, and the Archer stays put",
        action: async () => {
            enemyHealthBefore = enemyWarrior.getHealth();
            clientPlayer()["onLeftClickTile"](enemyWarrior.getTile(), -1, -1);
            await utils.waitUntil(() => enemyWarrior.getHealth() < enemyHealthBefore, 5000, "The Warrior to take damage");
            utils.log(`Shot: Warrior ${enemyHealthBefore} -> ${enemyWarrior.getHealth()} HP`, "yellow");
        },
        verification: () =>
            archer.getHealth() === 100 &&
            archer.getTile() === archerTile &&
            archer.getAvailableMovement() === 0 &&
            !aiming().isAiming() &&
            aiming()["overlays"].length === 0
    });

    runner.addStep({
        name: "A second shot in the same turn is refused, even when sent straight to the server",
        action: async () => {
            enemyHealthBefore = enemyWarrior.getHealth();
            WebsocketClient.sendMessage({
                event: "attackUnit",
                id: archer.getID(),
                targetX: enemyWarrior.getTile().getGridX(),
                targetY: enemyWarrior.getTile().getGridY()
            });
            await utils.delay(800);
        },
        verification: () => enemyWarrior.getHealth() === enemyHealthBefore
    });

    runner.addStep({
        name: "Next turn, the B hotkey starts aiming, and a right-click away from any target stops it without moving the Archer",
        action: async () => {
            await endTurn();
            await select(archer);
            await pressB();
            if (!aiming().isAiming()) throw new Error("Pressing B didn't start aiming");
            // The Archer's own tile is never a target.
            clientPlayer()["onMouseRightRelease"](archer.getTile());
            await utils.delay(800);
        },
        verification: () =>
            !aiming().isAiming() && aiming()["overlays"].length === 0 && archer.getTile() === archerTile && archer.getAvailableMovement() > 0
    });

    runner.addStep({
        name: "B does nothing with a melee unit selected",
        action: async () => {
            const warrior = utils.getClientPlayer().getUnits().find((unit) => unit.getName() === "Warrior");
            clientPlayer().selectUnit(warrior);
            await pressB();
        },
        verification: () => !aiming().isAiming() && aiming()["overlays"].length === 0
    });

    runner.addStep({
        name: "Keep shooting (right-click on the target, no aiming) until the Warrior dies; the Archer never moves",
        action: async () => {
            for (let turn = 0; turn < 12 && isAlive(enemyWarrior); turn++) {
                await select(archer);
                enemyHealthBefore = enemyWarrior.getHealth();
                clientPlayer()["previewAttack"](enemyWarrior.getTile());
                await utils.delay(400);
                clientPlayer()["moveSelectedUnit"](enemyWarrior.getTile());
                await utils.delay(700);

                const hp = isAlive(enemyWarrior) ? `${enemyWarrior.getHealth()} HP` : "dead";
                utils.log(`Turn ${turn + 1}: Warrior ${hp}`, "yellow");
                if (isAlive(enemyWarrior) && enemyWarrior.getHealth() >= enemyHealthBefore) throw new Error("The shot did no damage");
                if (isAlive(enemyWarrior)) await endTurn();
            }
            watch(archer);
            NetworkEvents.removeCallbacksByParentObject(listener);
        },
        verification: () => !isAlive(enemyWarrior) && archer.getTile() === archerTile && archer.getHealth() === 100
    });

    return runner;
}
