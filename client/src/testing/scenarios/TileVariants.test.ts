import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { resolveSpriteRegion } from "../../Assets";
import { SpriteAtlas } from "../../SpriteAtlas";
import { GameMap } from "../../map/GameMap";
import { Tile } from "../../map/Tile";
import { TestUtils } from "../TestUtils";

// Grass, plains, tundra, desert and mountain each draw with one of three sprites, picked from the
// tile's coordinates. Reveals the whole map, checks every sprite turns up, that the pick is stable
// and leaves the tile's type alone, then centers on a varied patch to look at.
export function setupTileVariantsTest(game: Game) {
  const runner = new TestRunner("TileVariants");
  const utils = new TestUtils(game);
  const terrains = ["grass", "plains", "tundra", "desert", "mountain"];
  const spritesFor = (terrain: string) => [terrain, `${terrain}_2`, `${terrain}_3`];
  // How many tiles draw with each sprite, keyed by its tile type ("grass_2").
  const spriteCounts = new Map<string, number>();
  let tiles: Tile[] = [];

  const allTiles = () => GameMap.getInstance().getTiles().flat().filter((tile) => !!tile);
  const baseType = (tile: Tile) => tile.getTileTypes()[0];
  const drawnAs = (tile: Tile) => Tile.getVariantTileType(baseType(tile), tile.getGridX(), tile.getGridY());

  runner.addStep({
    name: "Start with the whole map revealed",
    action: async () => {
      await utils.ensureInGame({ allowBarbarians: false, revealMap: true });
      await utils.waitUntil(() => allTiles().length > 500, 10000, "The map to arrive");
      await utils.delay(1000);
      tiles = allTiles();
      for (const tile of tiles) {
        const sprite = drawnAs(tile);
        spriteCounts.set(sprite, (spriteCounts.get(sprite) ?? 0) + 1);
      }
      for (const terrain of terrains) {
        utils.log(`${terrain}: ${spritesFor(terrain).map((sprite) => spriteCounts.get(sprite) ?? 0).join(" / ")}`);
      }
    },
    verification: () => tiles.length > 500
  });

  runner.addStep({
    name: "Every terrain shows all three of its sprites, and each one is in the sprite atlas",
    action: async () => {},
    verification: () =>
      terrains.every((terrain) =>
        spritesFor(terrain).every(
          (sprite) =>
            (spriteCounts.get(sprite) ?? 0) > 0 &&
            !!SpriteAtlas.getInstance().getRegion(resolveSpriteRegion(`TILE_${sprite.toUpperCase()}`))
        )
      )
  });

  runner.addStep({
    name: "The pick is the same every time, the tile keeps its own type, and about half stay plain",
    action: async () => {
      const varied = tiles.filter((tile) => terrains.includes(baseType(tile)));
      const plain = varied.filter((tile) => drawnAs(tile) === baseType(tile)).length;
      utils.log(`${plain} of ${varied.length} tiles use the plain sprite`);
    },
    verification: () => {
      const varied = tiles.filter((tile) => terrains.includes(baseType(tile)));
      const plainShare = varied.filter((tile) => drawnAs(tile) === baseType(tile)).length / varied.length;
      return (
        tiles.every((tile) => drawnAs(tile) === drawnAs(tile)) &&
        tiles.every((tile) => !/_\d$/.test(baseType(tile))) &&
        plainShare > 0.35 &&
        plainShare < 0.65
      );
    }
  });

  runner.addStep({
    name: "Center on a patch with plenty of variety",
    action: async () => {
      const distinctAround = (tile: Tile) =>
        new Set([tile, ...tile.getAdjacentTiles()].filter((adjTile) => !!adjTile).map(drawnAs)).size;
      const best = tiles.reduce((a, b) => (distinctAround(b) > distinctAround(a) ? b : a));
      utils.getInGameScene().focusOnTile(best, 2);
      utils.log("Pan around: each terrain mixes its plain sprite with two variants.", "yellow");

      const results = document.getElementById("test-results");
      if (results) results.style.pointerEvents = "none";
    },
    verification: () => true
  });

  return runner;
}
