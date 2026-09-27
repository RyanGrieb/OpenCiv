import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { GameImage, resolveSpriteRegion } from "../../Assets";
import { SpriteAtlas } from "../../SpriteAtlas";
import { WebsocketClient } from "../../network/Client";
import { GameMap } from "../../map/GameMap";
import { HexPixels } from "../../map/HexPixels";
import { Tile } from "../../map/Tile";
import { TestUtils } from "../TestUtils";

// Where two different kinds of land meet (plains beside grassland, say), their pixels fray into
// each other across a wobbly line instead of a hard hex edge. Starts on the terrain_mix map preset
// (patches of grassland, plains, desert, tundra and snow with a few hills and a mountain around the
// Settler) with the whole map revealed, then compares the drawn map against each tile's own sprite:
// every border between two kinds of land is blended (a hill's as its flat ground), and tiles among
// their own kind are drawn untouched.
export function setupTerrainBlendingTest(game: Game) {
  const runner = new TestRunner("TerrainBlending");
  const utils = new TestUtils(game);
  const map = () => GameMap.getInstance();
  const BLENDING_TERRAINS = ["grass", "plains", "desert", "tundra", "snow", "floodplains"];
  // How close to a side a pixel has to be to count as along it.
  const ALONG_SIDE = 4;
  const chunkPixels = new Map<string, CanvasRenderingContext2D>();
  const spritePixels = new Map<string, ImageData>();

  interface Border {
    tile: Tile;
    neighbor: Tile;
    side: number;
  }
  let borders: Border[] = [];
  let settlerTile: Tile | undefined;
  let failures: string[] = [];

  const allTiles = () =>
    map()
      .getTiles()
      .flat()
      .filter((tile) => !!tile);
  const terrain = (tile: Tile) => tile.getTileTypes()[0];
  const ground = (tile: Tile) => terrain(tile).replace("_hill", "");
  const blends = (tile: Tile) => BLENDING_TERRAINS.includes(ground(tile));
  const describe = (tile: Tile) => `(${tile.getGridX()},${tile.getGridY()}) ${terrain(tile)}`;
  // Rivers and shores draw over the terrain too, so tiles near either are left out of the comparisons.
  const hasRiver = (tile: Tile) => tile.getRiverSides().some((river) => river);
  const isPlain = (tile: Tile) =>
    !hasRiver(tile) && tile.getAdjacentTiles().every((adj) => adj && !adj.isWater() && !hasRiver(adj));

  // The drawn base layer's color at one of a tile's own pixels.
  const drawnPixel = (tile: Tile, px: number, py: number): number[] => {
    const chunk = map().getBaseLayerChunkAt(tile.getGridX(), tile.getGridY());
    const key = `${chunk.getX()},${chunk.getY()}`;
    let context = chunkPixels.get(key);
    if (!context) {
      const canvas = document.createElement("canvas");
      canvas.width = chunk.getWidth();
      canvas.height = chunk.getHeight();
      context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(chunk.getImage(), 0, 0);
      chunkPixels.set(key, context);
    }
    const x = tile.getX() + px - chunk.getX();
    const y = tile.getY() + py - chunk.getY();
    return Array.from(context.getImageData(x, y, 1, 1).data);
  };

  // The tile's own terrain sprite's color at one of its pixels, or transparent off the sprite.
  const ownPixel = (tile: Tile, px: number, py: number): number[] => {
    if (px < 0 || py < 0 || px >= Tile.WIDTH || py >= Tile.HEIGHT) return [0, 0, 0, 0];
    const type = Tile.getVariantTileType(terrain(tile), tile.getGridX(), tile.getGridY());
    let sprite = spritePixels.get(type);
    if (!sprite) {
      const canvas = document.createElement("canvas");
      canvas.width = Tile.WIDTH;
      canvas.height = Tile.HEIGHT;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const region = SpriteAtlas.getInstance().getRegion(resolveSpriteRegion(`TILE_${type.toUpperCase()}`));
      const spritesheet = game.getImage(GameImage.SPRITESHEET);
      context.drawImage(spritesheet, region.x, region.y, region.w, region.h, 0, 0, Tile.WIDTH, Tile.HEIGHT);
      sprite = context.getImageData(0, 0, Tile.WIDTH, Tile.HEIGHT);
      spritePixels.set(type, sprite);
    }
    const index = (py * Tile.WIDTH + px) * 4;
    return Array.from(sprite.data.slice(index, index + 4));
  };

  // Whether a neighbor's sprite reaches over this pixel: the terrain sprites' ragged edges overlap a
  // little, so a pixel there is drawn partly from the neighbor with or without any blending.
  const underNeighborFringe = (tile: Tile, px: number, py: number): boolean =>
    tile.getAdjacentTiles().some((neighbor, side) => {
      if (!neighbor) return false;
      const [offsetX, offsetY] = HexPixels.NEIGHBOR_OFFSETS[side];
      return ownPixel(neighbor, px - offsetX, py - offsetY)[3] > 0;
    });

  // Whether a pixel is close to a side, and closer to it than to any other (a corner pixel may blend
  // toward the neighbor across the other side instead).
  const isAlongSide = (px: number, py: number, side: number): boolean => {
    const distance = HexPixels.distanceToSide(px + 0.5, py + 0.5, side);
    if (distance > ALONG_SIDE) return false;
    return [0, 1, 2, 3, 4, 5].every(
      (other) => other === side || HexPixels.distanceToSide(px + 0.5, py + 0.5, other) > distance
    );
  };

  // How many of a tile's pixels (all of them, or those along one side) are drawn differently from its sprite.
  const changedPixels = (tile: Tile, side?: number): number => {
    let changed = 0;
    for (let py = 0; py < Tile.HEIGHT; py++) {
      for (let px = 0; px < Tile.WIDTH; px++) {
        if (!HexPixels.insideHex(px, py)) continue;
        if (side !== undefined && !isAlongSide(px, py, side)) continue;
        const own = ownPixel(tile, px, py);
        if (own[3] < 255 || underNeighborFringe(tile, px, py)) continue;
        if (drawnPixel(tile, px, py).some((value, i) => value !== own[i])) changed++;
      }
    }
    return changed;
  };

  runner.addStep({
    name: "Start on the terrain_mix map with the whole map revealed",
    action: async () => {
      WebsocketClient.init("localhost");
      await utils.waitUntil(() => game.getCurrentScene().getName() === "lobby", 5000, "Scene to become lobby");

      WebsocketClient.sendMessage({ event: "setGameOption", option: "mapPreset", value: "terrain_mix" });
      WebsocketClient.sendMessage({ event: "setGameOption", option: "revealMap", value: true });
      WebsocketClient.sendMessage({ event: "setGameOption", option: "allowBarbarians", value: false });
      WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
      await utils.waitUntil(() => game.getCurrentScene().getName() === "in_game", 15000, "Scene to become in_game");
      // Every tile, so the blends along chunk edges have been drawn too.
      await utils.waitUntil(
        () => allTiles().length === map().getWidth() * map().getHeight(),
        60000,
        "The whole map to arrive"
      );
      // Queued behind every chunk still being drawn, the edges redrawn late along chunk borders included.
      await map().redrawMap([]);
      await utils.delay(500);

      settlerTile = (await utils.findUnitWithAction("settle")).getTile();
      for (const tile of allTiles().filter((tile) => blends(tile) && isPlain(tile))) {
        tile.getAdjacentTiles().forEach((neighbor, side) => {
          if (blends(neighbor) && ground(neighbor) !== ground(tile)) borders.push({ tile, neighbor, side });
        });
      }
      utils.log(`${borders.length} sides where two kinds of land meet`);
    },
    verification: () => !!settlerTile && borders.length > 20
  });

  runner.addStep({
    name: "Along every border between two kinds of land, the two grounds mix",
    action: async () => {
      failures = [];
      // Each pair once. The border wanders either side of the hex side, so along a short stretch
      // only one of the two tiles may take on the other's ground.
      const pairs = borders.filter(({ tile, neighbor }) => isPlain(neighbor) && ground(tile) < ground(neighbor));
      let bothWays = 0;
      for (const { tile, neighbor, side } of pairs) {
        const changed = changedPixels(tile, side);
        const neighborChanged = changedPixels(neighbor, (side + 3) % 6);
        if (changed > 0 && neighborChanged > 0) bothWays++;
        if (changed + neighborChanged > 0) continue;
        failures.push(`${describe(tile)} side ${side} next to ${terrain(neighbor)}: unblended`);
      }
      utils.log(`${pairs.length} borders checked, ${bothWays} of them mixed on both sides`);
      failures.slice(0, 5).forEach((failure) => utils.log(failure, "red"));
    },
    verification: () => failures.length === 0
  });

  runner.addStep({
    name: "Tiles among their own kind, and mountains, are drawn untouched",
    action: async () => {
      failures = [];
      const untouched = allTiles()
        .filter(isPlain)
        .filter(
          (tile) => terrain(tile) === "mountain" || tile.getAdjacentTiles().every((adj) => ground(adj) === ground(tile))
        )
        .slice(0, 80);
      for (const tile of untouched) {
        const changed = changedPixels(tile);
        if (changed > 0) failures.push(`${describe(tile)}: ${changed} pixels changed`);
      }
      utils.log(`${untouched.length} tiles checked`);
      failures.slice(0, 5).forEach((failure) => utils.log(failure, "red"));
    },
    verification: () => failures.length === 0
  });

  runner.addStep({
    name: "Center on the patchwork around the Settler",
    action: async () => {
      utils.getInGameScene().focusOnTile(settlerTile!, 3);
      utils.log("Grassland, plains, desert, tundra and snow now fray into each other at their borders.", "yellow");

      const results = document.getElementById("test-results");
      if (results) results.style.pointerEvents = "none";
    },
    verification: () => true
  });

  return runner;
}
