import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { GameMap } from "../../map/GameMap";
import { FogOfWarLayer } from "../../map/FogOfWarLayer";
import { Tile } from "../../map/Tile";
import { TestUtils } from "../TestUtils";

// Unexplored tiles are hidden under pixel-art clouds instead of a flat gray, and the clouds thin out
// over the tiles at the edge of sight. Starts a normal fogged game, samples the clouds deep in the
// unexplored map and across the edge of sight, then leaves the camera on that edge to look at.
export function setupCloudFogTest(game: Game) {
  const runner = new TestRunner("CloudFog");
  const utils = new TestUtils(game);
  const map = () => GameMap.getInstance();
  const fog = () => map().getFogOfWar();
  const centerOf = (gridX: number, gridY: number) => ({
    x: gridX * 32 + (gridY % 2 !== 0 ? 16 : 0) + 16,
    y: gridY * 25 + 16
  });
  const stateOf = (gridX: number, gridY: number) => fog().getTileState(gridX, gridY);
  const knownTiles = () =>
    map()
      .getTiles()
      .flat()
      .filter((tile) => !!tile);

  let cloudRow: number[][] = [];
  let edgeTile: Tile | undefined;
  let edgeSamples: number[] = [];

  runner.addStep({
    name: "Start a fogged game",
    action: async () => {
      await utils.ensureInGame({ allowBarbarians: false, revealMap: false });
      await utils.waitUntil(() => !!fog() && knownTiles().length > 5, 10000, "The starting tiles to arrive");
      await utils.delay(500);
    },
    verification: () => knownTiles().length < map().getWidth() * map().getHeight()
  });

  runner.addStep({
    name: "Deep in the unexplored map, clouds cover everything, drawn in several light shades rather than one gray",
    action: async () => {
      // A row of tiles nobody has seen, three tiles either side of the sample.
      const isUnexploredRun = (gridX: number, gridY: number) => {
        for (let x = gridX - 3; x <= gridX + 3; x++) {
          for (let y = gridY - 3; y <= gridY + 3; y++) {
            if (x < 0 || y < 0 || x >= map().getWidth() || y >= map().getHeight()) return false;
            if (stateOf(x, y) !== FogOfWarLayer.UNEXPLORED) return false;
          }
        }
        return true;
      };
      let start: { x: number; y: number } | undefined;
      for (let gridY = 3; gridY < map().getHeight() - 3 && !start; gridY++) {
        for (let gridX = 3; gridX < map().getWidth() - 3 && !start; gridX++) {
          if (isUnexploredRun(gridX, gridY)) start = centerOf(gridX, gridY);
        }
      }
      if (!start) throw new Error("No unexplored stretch of map found");

      cloudRow = [];
      for (let x = 0; x < 64; x++) cloudRow.push(fog().getPixelAt(start.x - 32 + x, start.y));
      const shades = new Set(cloudRow.map(([red, green, blue]) => `${red},${green},${blue}`));
      utils.log(`${shades.size} shades across 64 cloud pixels, lightest red ${Math.max(...cloudRow.map((p) => p[0]))}`);
    },
    verification: () => {
      const shades = new Set(cloudRow.map(([red, green, blue]) => `${red},${green},${blue}`));
      const opaque = cloudRow.every((pixel) => pixel[3] === 255);
      // The old flat fog was RGB 128 everywhere; clouds have tops well lighter than that.
      const hasLightTops = cloudRow.some(([red]) => red > 200);
      return opaque && shades.size >= 3 && hasLightTops;
    }
  });

  runner.addStep({
    name: "Across the edge of sight the clouds thin out: partly see-through over the outer tiles, opaque past them",
    action: async () => {
      let unexploredNeighbor: { x: number; y: number } | undefined;
      for (const tile of knownTiles()) {
        if (stateOf(tile.getGridX(), tile.getGridY()) !== FogOfWarLayer.VISIBLE) continue;
        // Straight east or west, so the samples cross the hex's side rather than clip a corner.
        const side = [-1, 1]
          .map((dx) => ({ x: tile.getGridX() + dx, y: tile.getGridY() }))
          .find(
            (coord) =>
              coord.x >= 0 && coord.x < map().getWidth() && stateOf(coord.x, coord.y) === FogOfWarLayer.UNEXPLORED
          );
        if (!side) continue;
        edgeTile = tile;
        unexploredNeighbor = side;
        break;
      }
      if (!edgeTile) throw new Error("No visible tile next to an unexplored one");

      const from = centerOf(edgeTile.getGridX(), edgeTile.getGridY());
      const to = centerOf(unexploredNeighbor.x, unexploredNeighbor.y);
      edgeSamples = [];
      for (let step = 0; step <= 20; step++) {
        const x = from.x + ((to.x - from.x) * step) / 20;
        const y = from.y + ((to.y - from.y) * step) / 20;
        edgeSamples.push(fog().getPixelAt(x, y)[3] / 255);
      }
      utils.log(`Cloud opacity from visible to unexplored: ${edgeSamples.map((alpha) => alpha.toFixed(2)).join(" ")}`);
      utils.getInGameScene().focusOnTile(edgeTile, 3);
    },
    verification: () => {
      const partial = edgeSamples.some((alpha) => alpha > 0.1 && alpha < 0.9);
      // Halfway along is the hex edge; past it lies only the unexplored tile.
      const opaquePastEdge = edgeSamples.slice(10).every((alpha) => alpha > 0.9);
      return edgeSamples[0] < 0.6 && partial && opaquePastEdge;
    }
  });

  return runner;
}
