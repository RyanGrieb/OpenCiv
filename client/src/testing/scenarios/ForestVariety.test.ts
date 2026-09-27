import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { resolveSpriteRegion } from "../../Assets";
import { SpriteAtlas } from "../../SpriteAtlas";
import { WebsocketClient } from "../../network/Client";
import { GameMap } from "../../map/GameMap";
import { Tile } from "../../map/Tile";
import { TestUtils } from "../TestUtils";

// Forest and jungle each draw with one of three sprites (different density and color), picked
// from the tile's coordinates, and forests on tundra always wear one of two autumn looks. Starts on
// the forests map preset (temperate forest, jungle and tundra forest around the Settler), checks
// every look turns up and the tile's own types are left alone, then centers on the woods.
export function setupForestVarietyTest(game: Game) {
  const runner = new TestRunner("ForestVariety");
  const utils = new TestUtils(game);
  const TEMPERATE_LOOKS = ["forest", "forest_2", "forest_3", "jungle", "jungle_2", "jungle_3"];
  const AUTUMN_LOOKS = ["forest_autumn", "forest_autumn_2"];
  const TUNDRA = ["tundra", "tundra_hill"];
  // How many tiles draw with each look, keyed by its tile type ("forest_2").
  const lookCounts = new Map<string, number>();
  let wooded: Tile[] = [];
  let settlerTile: Tile | undefined;

  const allTiles = () =>
    GameMap.getInstance()
      .getTiles()
      .flat()
      .filter((tile) => !!tile);
  const feature = (tile: Tile) => tile.getTileTypes().find((type) => type === "forest" || type === "jungle");
  const drawnAs = (tile: Tile) =>
    Tile.getVariantFeatureType(feature(tile)!, tile.getTileTypes()[0], tile.getGridX(), tile.getGridY());
  const onTundra = (tile: Tile) => TUNDRA.includes(tile.getTileTypes()[0]);

  runner.addStep({
    name: "Start on the forests map with the whole map revealed",
    action: async () => {
      WebsocketClient.init("localhost");
      await utils.waitUntil(() => game.getCurrentScene().getName() === "lobby", 5000, "Scene to become lobby");

      WebsocketClient.sendMessage({ event: "setGameOption", option: "mapPreset", value: "forests" });
      WebsocketClient.sendMessage({ event: "setGameOption", option: "revealMap", value: true });
      WebsocketClient.sendMessage({ event: "setGameOption", option: "allowBarbarians", value: false });
      WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
      await utils.waitUntil(() => game.getCurrentScene().getName() === "in_game", 15000, "Scene to become in_game");
      await utils.waitUntil(() => allTiles().length > 500, 10000, "The map to arrive");

      settlerTile = (await utils.findUnitWithAction("settle")).getTile();
      wooded = allTiles().filter((tile) => !!feature(tile));
      for (const tile of wooded) lookCounts.set(drawnAs(tile), (lookCounts.get(drawnAs(tile)) ?? 0) + 1);
      utils.log([...lookCounts].map(([look, count]) => `${look}: ${count}`).join(", "));
    },
    verification: () => !!settlerTile && wooded.length > 0
  });

  runner.addStep({
    name: "Every forest and jungle look shows up, and each one is in the sprite atlas",
    action: async () => {},
    verification: () =>
      [...TEMPERATE_LOOKS, ...AUTUMN_LOOKS].every(
        (look) =>
          (lookCounts.get(look) ?? 0) > 0 &&
          !!SpriteAtlas.getInstance().getRegion(resolveSpriteRegion(`TILE_${look.toUpperCase()}`))
      )
  });

  runner.addStep({
    name: "Tundra forests are always autumn and no other forest is, and every tile keeps its own types",
    action: async () => {},
    verification: () =>
      wooded.every((tile) => AUTUMN_LOOKS.includes(drawnAs(tile)) === (onTundra(tile) && feature(tile) === "forest")) &&
      wooded.every((tile) => tile.getTileTypes().every((type) => !/_\d$|autumn/.test(type)))
  });

  runner.addStep({
    name: "About half of the temperate forest and jungle keeps the plain sprite",
    action: async () => {
      const temperate = wooded.filter((tile) => !onTundra(tile));
      const plain = temperate.filter((tile) => drawnAs(tile) === feature(tile)).length;
      utils.log(`${plain} of ${temperate.length} temperate woods use the plain sprite`);
    },
    verification: () => {
      const temperate = wooded.filter((tile) => !onTundra(tile));
      const plainShare = temperate.filter((tile) => drawnAs(tile) === feature(tile)).length / temperate.length;
      return plainShare > 0.3 && plainShare < 0.7;
    }
  });

  runner.addStep({
    name: "Center on the woods around the Settler",
    action: async () => {
      utils.getInGameScene().focusOnTile(settlerTile!, 3);
      utils.log("Left: temperate forest. Middle: jungle. Right: autumn tundra forest.", "yellow");

      const results = document.getElementById("test-results");
      if (results) results.style.pointerEvents = "none";
    },
    verification: () => true
  });

  return runner;
}
