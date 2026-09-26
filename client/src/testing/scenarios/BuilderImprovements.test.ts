import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { Tile } from "../../map/Tile";
import { GameMap } from "../../map/GameMap";
import { InGameScene } from "../../scene/type/InGameScene";
import { TestUtils } from "../TestUtils";

// Plays a Builder's work out against a live server, on a revealed map with every tech researched
// (the startWithAllTechs and startWithBuilder game options): it farms a patch of grassland, lays a
// road on it and the tile beside it, then clears a forest. Build buttons are pressed through the
// unit info window the way a player would.
export function setupBuilderImprovementsTest(game: Game) {
    const runner = new TestRunner("BuilderImprovements");
    const utils = new TestUtils(game);
    let builder: Unit | undefined;
    let farmTile: Tile | undefined;
    let roadTile: Tile | undefined;
    let forestTile: Tile | undefined;
    let foodBefore = 0;

    const clientPlayer = () => utils.getClientPlayer() as unknown as Record<string, any>;
    const scene = () => game.getCurrentSceneAs<InGameScene>();
    const allTiles = () => GameMap.getInstance().getTiles().flatMap((column) => (column ?? []).filter(Boolean));
    const isBareLand = (tile: Tile, base: string[]) =>
        tile.getTileTypes().length === 1 && base.includes(tile.getTileTypes()[0]) && tile.getUnits().length === 0;

    // The buttons the unit info window is showing for the selected Builder.
    const actionButtons = (): Record<string, any>[] => builder["unitDisplayInfo"]?.["actionButtons"] ?? [];
    const shownActions = () => builder.getActions().filter((action) => action.requirementsMet(builder));

    const select = (unit: Unit) => {
        for (let click = 0; click < 4 && clientPlayer()["selectedUnit"] !== unit; click++) {
            clientPlayer()["onClickedTileWithUnit"](unit.getTile());
        }
        if (clientPlayer()["selectedUnit"] !== unit) throw new Error(`Couldn't select ${unit.getName()}`);
    };

    const endTurnsUntil = async (condition: () => boolean, maxTurns: number, message: string) => {
        for (let turn = 0; turn < maxTurns; turn++) {
            if (condition()) return;
            WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
            await utils.delay(400);
        }
        if (!condition()) throw new Error(`Not reached within ${maxTurns} turns: ${message}`);
    };

    const walkTo = async (target: Tile) => {
        scene().focusOnTile(target, 3);
        WebsocketClient.sendMessage({
            event: "moveUnit",
            unitX: builder.getTile().getGridX(),
            unitY: builder.getTile().getGridY(),
            id: builder.getID(),
            targetX: target.getGridX(),
            targetY: target.getGridY()
        });
        await endTurnsUntil(() => builder.getTile() === target, 12, "Builder to reach its tile");
        await endTurnsUntil(() => builder.getAvailableMovement() > 0, 2, "Builder to have movement left");
    };

    // Presses the action's button in the unit info window, then waits for the server to start the work.
    const pressBuild = async (actionName: string) => {
        select(builder);
        await utils.waitUntil(() => actionButtons().length === shownActions().length, 3000, "Action buttons to show");

        const index = shownActions().findIndex((action) => action.getName() === actionName);
        if (index === -1) throw new Error(`${actionName} isn't offered on this tile`);
        actionButtons()[index]["callbackFunction"]();

        await utils.waitUntil(() => !!builder.getBuildingImprovement(), 3000, `${actionName} to start`);
        // Long enough to read the countdown in the unit info window before the turns roll on.
        await utils.delay(1500);
    };

    const nearest = (predicate: (tile: Tile) => boolean) =>
        allTiles()
            .filter(predicate)
            .map((tile) => ({ tile, path: GameMap.getInstance().constructShortestPath(builder, builder.getTile(), tile) }))
            .filter(({ path }) => path.length > 1)
            .sort((a, b) => a.path.length - b.path.length)[0]?.tile;

    runner.addStep({
        name: "Start a revealed-map game with every tech and a Builder",
        action: async () => {
            WebsocketClient.init("localhost");
            await utils.waitUntil(() => game.getCurrentScene().getName() === "lobby", 5000, "Scene to become lobby");

            for (const option of ["revealMap", "startWithAllTechs", "startWithBuilder"]) {
                WebsocketClient.sendMessage({ event: "setGameOption", option, value: true });
            }
            // Barbarians would wander into the Builder's way.
            WebsocketClient.sendMessage({ event: "setGameOption", option: "allowBarbarians", value: false });
            WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
            await utils.waitUntil(() => game.getCurrentScene().getName() === "in_game", 15000, "Scene to become in_game");

            await utils.waitUntil(
                () => (builder = utils.getClientPlayer()?.getUnits().find((unit) => unit.getName() === "Builder")) !== undefined,
                10000,
                "The Builder to appear"
            );
        },
        verification: () => builder.getActions().some((action) => action.getName() === "build_farm")
    });

    runner.addStep({
        name: "Walk to open grassland, where a Farm, Trading Post and Road are offered",
        action: async () => {
            farmTile = nearest(
                (tile) =>
                    isBareLand(tile, ["grass"]) &&
                    tile.getAdjacentTiles().some((neighbor) => neighbor && isBareLand(neighbor, ["grass", "plains"]))
            );
            if (!farmTile) throw new Error("No open grassland in reach");

            await walkTo(farmTile);
            select(builder);
            foodBefore = farmTile.getTileYield()?.food ?? 0;
        },
        verification: () =>
            JSON.stringify(shownActions().map((action) => action.getName())) ===
            JSON.stringify(["build_farm", "build_trading_post", "build_road"])
    });

    runner.addStep({
        name: "Build a Farm: the Builder stops moving and counts down 7 turns",
        action: async () => {
            await pressBuild("build_farm");
        },
        verification: () =>
            builder.getBuildingImprovement() === "Farm" && builder.getBuildTurnsLeft() === 7 && builder.getAvailableMovement() === 0
    });

    runner.addStep({
        name: "After 7 turns the tile is a Farm with +1 food, and only a Road is left to build",
        action: async () => {
            await endTurnsUntil(() => farmTile.getTileTypes().includes("farm"), 9, "Farm to finish");
            select(builder);
        },
        verification: () =>
            !builder.getBuildingImprovement() &&
            farmTile.getTileYield()?.food === foodBefore + 1 &&
            JSON.stringify(shownActions().map((action) => action.getName())) === JSON.stringify(["build_road"])
    });

    runner.addStep({
        name: "Lay a road on the Farm and on the tile beside it",
        action: async () => {
            await pressBuild("build_road");
            await endTurnsUntil(() => farmTile.getTileTypes().includes("road"), 5, "First road to finish");

            roadTile = farmTile.getAdjacentTiles().find((tile) => tile && isBareLand(tile, ["grass", "plains"]));
            await walkTo(roadTile);
            await pressBuild("build_road");
            await endTurnsUntil(() => roadTile.getTileTypes().includes("road"), 5, "Second road to finish");
            scene().focusOnTile(roadTile, 4);
        },
        verification: () => farmTile.hasRoad() && roadTile.hasRoad()
    });

    runner.addStep({
        name: "Moving along the road costs a third of a move",
        action: async () => {
            await endTurnsUntil(() => builder.getAvailableMovement() === builder.getDefaultMoveDistance(), 2, "A fresh turn");
            WebsocketClient.sendMessage({
                event: "moveUnit",
                unitX: roadTile.getGridX(),
                unitY: roadTile.getGridY(),
                id: builder.getID(),
                targetX: farmTile.getGridX(),
                targetY: farmTile.getGridY()
            });
            await utils.waitUntil(() => builder.getTile() === farmTile, 3000, "Builder to step onto the Farm");
        },
        verification: () =>
            Math.abs(Tile.getWeight(roadTile, farmTile, builder) - 1 / 3) < 0.001 &&
            Math.abs(builder.getAvailableMovement() - 5 / 3) < 0.001
    });

    runner.addStep({
        name: "Clear a forest (4 turns), which then offers a Farm",
        action: async () => {
            forestTile = nearest(
                (tile) => JSON.stringify(tile.getTileTypes()) === JSON.stringify(["grass", "forest"]) && tile.getUnits().length === 0
            );
            if (!forestTile) throw new Error("No plain grassland forest in reach");

            await walkTo(forestTile);
            await pressBuild("build_remove_forest");
            await endTurnsUntil(() => !forestTile.getTileTypes().includes("forest"), 6, "Forest to be cleared");
            select(builder);
        },
        verification: () => shownActions().some((action) => action.getName() === "build_farm")
    });

    return runner;
}
