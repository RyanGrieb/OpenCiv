import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { TestUtils } from "../TestUtils";

export function setupUnitStackingTest(game: Game) {
    const runner = new TestRunner("UnitStacking");
    const utils = new TestUtils(game);
    let settler: Unit | undefined;
    let warrior: Unit | undefined;

    runner.addStep({
        name: "Login and Join Game",
        action: async () => {
            await utils.ensureInGame();
        },
        verification: async () => {
            return game.getCurrentScene().getName() === "in_game";
        }
    });

    runner.addStep({
        name: "Find starting Settler and Warrior",
        action: async () => {
            await utils.waitUntil(() => {
                const player = utils.getClientPlayer();
                if (!player) return false;

                settler = player.getUnits().find(u => u.isUtility());
                warrior = player.getUnits().find(u => !u.isUtility());
                return settler !== undefined && warrior !== undefined;
            }, 10000, "Settler and Warrior to exist");
        },
        verification: () => settler !== undefined && warrior !== undefined
    });

    runner.addStep({
        name: "Utility and non-utility ally units can share a tile",
        action: () => { },
        verification: () => {
            return !settler.getTile().hasBlockingUnit(warrior) && !warrior.getTile().hasBlockingUnit(settler);
        }
    });

    runner.addStep({
        name: "Same-type ally units cannot share a tile",
        action: () => { },
        verification: () => {
            const fakeAllyWarrior = { isUtility: () => false, getPlayer: () => warrior.getPlayer() } as unknown as Unit;
            const fakeAllySettler = { isUtility: () => true, getPlayer: () => settler.getPlayer() } as unknown as Unit;

            return warrior.getTile().hasBlockingUnit(fakeAllyWarrior) && settler.getTile().hasBlockingUnit(fakeAllySettler);
        }
    });

    runner.addStep({
        name: "Enemy units always block, regardless of type",
        action: () => { },
        verification: () => {
            const fakeEnemyUnit = { isUtility: () => true, getPlayer: () => ({} as any) } as unknown as Unit;
            return settler.getTile().hasBlockingUnit(fakeEnemyUnit);
        }
    });

    runner.addStep({
        name: "Warrior actually moves onto the Settler's tile",
        action: () => {
            WebsocketClient.sendMessage({
                event: "moveUnit",
                unitX: warrior.getTile().getGridX(),
                unitY: warrior.getTile().getGridY(),
                id: warrior.getID(),
                targetX: settler.getTile().getGridX(),
                targetY: settler.getTile().getGridY()
            });
        },
        verification: async () => {
            await utils.waitUntil(() => warrior.getTile() === settler.getTile(), 5000, "Warrior to move onto Settler's tile");
            return true;
        }
    });

    return runner;
}
