import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Tile } from "../../map/Tile";
import { GameMap } from "../../map/GameMap";
import { InGameScene } from "../../scene/type/InGameScene";
import { TestUtils } from "../TestUtils";

// Starts on the natural_wonders map preset (server/config/map_presets.yml): all seven natural
// wonders within sight of the Settler, with fog of war on, so each one is discovered on the first
// turn. Checks their Civ 5 yields, the hover name, the discovery notifications, and that no unit
// can walk onto one. Ends zoomed in on the wonders to look over by eye.
export function setupNaturalWondersTest(game: Game) {
  const runner = new TestRunner("NaturalWonders");
  const utils = new TestUtils(game);
  // tile type -> [name, yields], matching server/config/tiles.yml.
  const WONDERS: Record<string, [string, Record<string, number>]> = {
    mt_fuji: ["Mt. Fuji", { faith: 3, culture: 2 }],
    mt_kilimanjaro: ["Mt. Kilimanjaro", { food: 3, culture: 2 }],
    cerro_de_potosi: ["Cerro de Potosi", { gold: 10 }],
    grand_mesa: ["Grand Mesa", { production: 2, gold: 3 }],
    barringer_crater: ["Barringer Crater", { gold: 2, science: 3 }],
    great_barrier_reef: ["Great Barrier Reef", { food: 2, production: 1, gold: 1, science: 2 }],
    krakatoa: ["Krakatoa", { science: 5 }]
  };
  let settlerTile: Tile | undefined;

  const scene = () => game.getCurrentSceneAs<InGameScene>();
  const wonderTile = (tileType: string) =>
    GameMap.getInstance()
      .getTiles()
      .flat()
      .find((tile) => tile?.getTileTypes().includes(tileType));
  // Only the non-zero yields, sorted by name, so a wonder's terrain yields showing through would
  // count as a mismatch and the order the server lists them in wouldn't.
  const nonZeroYields = (tile: Tile) =>
    Object.fromEntries(
      Object.entries(tile.getTileYield() ?? {})
        .filter(([, value]) => value > 0)
        .sort(([a], [b]) => a.localeCompare(b))
    );
  const sorted = (yields: Record<string, number>) =>
    Object.fromEntries(Object.entries(yields).sort(([a], [b]) => a.localeCompare(b)));
  const warrior = () =>
    utils
      .getClientPlayer()
      .getUnits()
      .find((unit) => unit.getName() === "Warrior");

  runner.addStep({
    name: "Start on the natural_wonders map with fog of war on",
    action: async () => {
      WebsocketClient.init("localhost");
      await utils.waitUntil(() => game.getCurrentScene().getName() === "lobby", 5000, "Scene to become lobby");

      WebsocketClient.sendMessage({ event: "setGameOption", option: "mapPreset", value: "natural_wonders" });
      WebsocketClient.sendMessage({ event: "setGameOption", option: "revealMap", value: false });
      WebsocketClient.sendMessage({ event: "setGameOption", option: "allowBarbarians", value: false });
      WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
      await utils.waitUntil(() => game.getCurrentScene().getName() === "in_game", 15000, "Scene to become in_game");

      const settler = await utils.findUnitWithAction("settle");
      settlerTile = settler.getTile();
      scene().focusOnTile(settlerTile, 4);
    },
    verification: () => !!settlerTile
  });

  runner.addStep({
    name: "All seven wonders are in sight, each yielding its Civ 5 yields instead of its terrain's",
    action: async () => {
      await utils.waitUntil(
        () => Object.keys(WONDERS).every((type) => wonderTile(type)),
        5000,
        "Every wonder to be seen"
      );
      for (const type of Object.keys(WONDERS)) {
        utils.log(`${type}: ${JSON.stringify(nonZeroYields(wonderTile(type)))}`, "yellow");
      }
    },
    verification: () =>
      Object.entries(WONDERS).every(
        ([type, [, yields]]) => JSON.stringify(nonZeroYields(wonderTile(type))) === JSON.stringify(sorted(yields))
      )
  });

  runner.addStep({
    name: "Hovering a wonder names it",
    action: async () => {
      scene().call("tileHovered", { tile: wonderTile("mt_fuji") });
      await utils.delay(300);
    },
    verification: () => {
      const text: string = scene()["tileInformationLabel"].getText();
      utils.log(`Hover label: ${text}`, "yellow");
      return text.includes("Mt. Fuji") && Tile.getTileTypeName("cerro_de_potosi") === "Cerro de Potosi";
    }
  });

  runner.addStep({
    name: "The server announced each wonder as it was discovered",
    action: async () => {
      await utils.waitUntil(
        () =>
          utils
            .getInGameScene()
            .getNotifications()
            .getAll()
            .filter((n) => n.text.startsWith("Natural wonder found")).length === 7,
        5000,
        "Seven discovery notifications"
      );
    },
    verification: () => {
      const texts = utils
        .getInGameScene()
        .getNotifications()
        .getAll()
        .map((notification) => notification.text);
      return Object.values(WONDERS).every(([name]) => texts.includes(`Natural wonder found: ${name}`));
    }
  });

  runner.addStep({
    name: "No unit can walk onto a wonder, even when told to",
    action: async () => {
      const unit = warrior();
      const target = wonderTile("grand_mesa");
      WebsocketClient.sendMessage({
        event: "moveUnit",
        unitX: unit.getTile().getGridX(),
        unitY: unit.getTile().getGridY(),
        id: unit.getID(),
        targetX: target.getGridX(),
        targetY: target.getGridY()
      });
      await utils.delay(1000);
    },
    verification: () => {
      const unit = warrior();
      return (
        Object.keys(WONDERS).every((type) => wonderTile(type).getMovementCost() >= 9999) &&
        GameMap.getInstance().constructShortestPath(unit, unit.getTile(), wonderTile("grand_mesa")).length === 0 &&
        unit.getTile() !== wonderTile("grand_mesa")
      );
    }
  });

  runner.addStep({
    name: "Look over the wonders",
    action: async () => {
      scene().focusOnTile(settlerTile, 5);
      await utils.delay(500);
    },
    verification: () => true
  });

  return runner;
}
