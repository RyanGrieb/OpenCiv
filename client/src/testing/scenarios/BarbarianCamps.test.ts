import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { Tile } from "../../map/Tile";
import { GameMap } from "../../map/GameMap";
import { AbstractPlayer } from "../../player/AbstractPlayer";
import { TestUtils } from "../TestUtils";

// Starts a game with barbarians on and the map revealed, then checks the camps are on the map with a
// barbarian guarding each, and that camps send out units over the next turns which then move around.
export function setupBarbarianCampsTest(game: Game) {
    const runner = new TestRunner("BarbarianCamps");
    const utils = new TestUtils(game);
    let campTiles: Tile[] = [];
    let barbarians: AbstractPlayer | undefined;
    let roamingUnit: Unit | undefined;

    const allTiles = () => GameMap.getInstance().getTiles().flat().filter((tile) => tile);
    const isCamp = (tile: Tile) => tile.getTileTypes().includes("barbarian_camp");
    const roamingUnits = () => (barbarians?.getUnits() ?? []).filter((unit) => !isCamp(unit.getTile()));

    const endTurn = async () => {
        WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
        await utils.delay(600);
    };

    runner.addStep({
        name: "Start a game with barbarians on and the map revealed",
        action: async () => {
            // Camps only ever appear in the fog, so without a revealed map there'd be nothing to see.
            await utils.ensureInGame({ allowBarbarians: true, revealMap: true });
            await utils.waitUntil(() => !!GameMap.getInstance()?.getTiles()?.length, 15000, "Map to load");
            await utils.delay(1500);
        },
        verification: () => game.getCurrentScene().getName() === "in_game"
    });

    runner.addStep({
        name: "The barbarians are a known player",
        action: async () => {
            await utils.waitUntil(
                () => !!utils.getInGameScene().getPlayers().find((player) => player.isBarbarian()),
                5000,
                "Barbarian player to arrive"
            );
            barbarians = utils.getInGameScene().getPlayers().find((player) => player.isBarbarian());
            utils.log(`Barbarian player: ${barbarians.getName()}`, "yellow");
        },
        verification: () => barbarians !== undefined && barbarians !== utils.getClientPlayer()
    });

    runner.addStep({
        name: "Camps are on the map, each guarded by a barbarian",
        action: async () => {
            campTiles = allTiles().filter(isCamp);
            campTiles.forEach((tile) => utils.log(`Camp at (${tile.getGridX()}, ${tile.getGridY()})`, "yellow"));

            if (campTiles.length > 0) {
                utils.getInGameScene().focusOnTile(campTiles[0], 3);
            }
        },
        verification: () =>
            campTiles.length > 0 &&
            campTiles.every((tile) => tile.getUnits().some((unit) => unit.getPlayer() === barbarians))
    });

    runner.addStep({
        name: "Camps stay clear of the players' starting units",
        action: async () => {},
        verification: () => {
            const startTiles = utils.getClientPlayer().getUnits().map((unit) => unit.getTile());
            return campTiles.every((camp) => startTiles.every((start) => Tile.gridDistance(camp, start) >= 3));
        }
    });

    runner.addStep({
        name: "A camp sends a unit out within a few turns",
        action: async () => {
            for (let turn = 0; turn < 14 && roamingUnits().length === 0; turn++) {
                await endTurn();
            }

            roamingUnit = roamingUnits()[0];
            if (!roamingUnit) throw new Error("No barbarian left a camp within 14 turns");

            const tile = roamingUnit.getTile();
            utils.log(`Barbarian ${roamingUnit.getName()} out at (${tile.getGridX()}, ${tile.getGridY()})`, "yellow");
            utils.getInGameScene().focusOnTile(tile, 3);
        },
        verification: () => roamingUnit !== undefined && roamingUnit.getPlayer() === barbarians
    });

    runner.addStep({
        name: "Barbarians that left camp move around on their own",
        action: async () => {
            const startTiles = new Map(roamingUnits().map((unit) => [unit, unit.getTile()]));

            for (let turn = 0; turn < 3; turn++) {
                await endTurn();
                if (roamingUnits().some((unit) => startTiles.has(unit) && unit.getTile() !== startTiles.get(unit))) return;
            }
            throw new Error("No barbarian moved in 3 turns");
        },
        verification: () => true
    });

    runner.addStep({
        name: "A player cannot order a barbarian around",
        action: async () => {
            const unit = roamingUnit;
            const from = unit.getTile();
            const target = from.getAdjacentTiles().find((tile) => tile && !tile.isWater() && tile.getUnits().length === 0);
            if (!target) throw new Error("No free tile next to the barbarian to try");

            WebsocketClient.sendMessage({
                event: "moveUnit",
                unitX: from.getGridX(),
                unitY: from.getGridY(),
                id: unit.getID(),
                targetX: target.getGridX(),
                targetY: target.getGridY()
            });
            await utils.delay(1000);

            // Checked before ending a turn, which would let the barbarians move it themselves.
            if (unit.getTile() !== from) throw new Error("The barbarian followed a player's move order");
        },
        verification: () => true
    });

    return runner;
}
