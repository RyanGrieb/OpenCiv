import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { GameMap } from "../../map/GameMap";
import { Tile } from "../../map/Tile";
import { TestUtils } from "../TestUtils";

// Where land meets water, the land gets a sandy shore and the water a line of foam, instead of a
// hard hex edge. Reveals the whole map, then samples the drawn map on both sides of every coastal
// hex side (chunk edges included, since those shores are drawn once the next chunk arrives), and
// checks a side with land on both sides stays plain. Last, centers on a stretch of coast.
export function setupCoastlineBlendingTest(game: Game) {
  const runner = new TestRunner("CoastlineBlending");
  const utils = new TestUtils(game);
  const map = () => GameMap.getInstance();
  // The hex's corners in a tile's own pixels; side i runs from corner i to i + 1 (as HexPixels.CORNERS).
  const corners = [
    [0, 7],
    [16, 0],
    [32, 7],
    [32, 25],
    [16, 32],
    [0, 25]
  ];
  // Beaches only: snow and tundra get an icy or gravel rim instead.
  const beachTerrains = ["grass", "plains", "desert", "grass_hill", "plains_hill", "desert_hill"];
  // The chunk canvases, drawn once each to sample from.
  const chunkPixels = new Map<string, CanvasRenderingContext2D>();

  interface Coast {
    land: Tile;
    water: Tile;
    side: number;
  }
  let coasts: Coast[] = [];
  let failures: string[] = [];

  const allTiles = () =>
    map()
      .getTiles()
      .flat()
      .filter((tile) => !!tile);

  // The drawn base layer's color at a world pixel.
  const pixelAt = (tile: Tile, worldX: number, worldY: number): number[] => {
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
    // A point just across the wrap seam from the tile lies a map's width away from its chunk.
    const worldWidth = map().getWidth() * 32;
    let x = Math.floor(worldX - chunk.getX());
    if (x < 0) x += worldWidth;
    if (x >= chunk.getWidth()) x -= worldWidth;
    return Array.from(context.getImageData(x, Math.floor(worldY - chunk.getY()), 1, 1).data);
  };

  // A point `offset` pixels from the middle of a tile's side: inside the tile when negative, inside
  // its neighbor across that side when positive.
  const offSide = (tile: Tile, side: number, offset: number) => {
    const [x1, y1] = corners[side];
    const [x2, y2] = corners[(side + 1) % 6];
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const length = Math.hypot(midX - 16, midY - 16);
    return [tile.getX() + midX + ((midX - 16) / length) * offset, tile.getY() + midY + ((midY - 16) / length) * offset];
  };
  // Whether any of a few points at these offsets matches: the hex's pixel outline steps around its
  // true sides, so which pixel sits right at the waterline varies a little from side to side.
  const anyOffSide = (
    tile: Tile,
    owner: Tile,
    side: number,
    offsets: number[],
    matches: (color: number[]) => boolean
  ) =>
    offsets.some((offset) => {
      const [x, y] = offSide(tile, side, offset);
      return matches(pixelAt(owner, x, y));
    });
  const near = (color: number[], [r, g, b]: number[]) =>
    Math.abs(color[0] - r) < 12 && Math.abs(color[1] - g) < 12 && Math.abs(color[2] - b) < 12;
  const isSand = (color: number[]) => near(color, [194, 170, 110]) || near(color, [228, 208, 142]);
  const isFoam = ([r, g, b]: number[]) => r > 180 && g > 190 && b > 200;
  const chunkOf = (tile: Tile) => `${Math.floor(tile.getGridX() / 4)},${Math.floor(tile.getGridY() / 4)}`;

  runner.addStep({
    name: "Start with the whole map revealed",
    action: async () => {
      await utils.ensureInGame({ allowBarbarians: false, revealMap: true });
      // Every tile, so the shores along chunk edges have been drawn too.
      await utils.waitUntil(
        () => allTiles().length === map().getWidth() * map().getHeight(),
        60000,
        "The whole map to arrive"
      );
      // Queued behind every chunk still being drawn, the shores drawn late along chunk edges included.
      await map().redrawMap([]);
      await utils.delay(500);

      for (const land of allTiles().filter((tile) => !tile.isWater())) {
        land.getAdjacentTiles().forEach((neighbor, side) => {
          if (neighbor?.isWater()) coasts.push({ land, water: neighbor, side });
        });
      }
      utils.log(`${coasts.length} coastal hex sides`);
    },
    verification: () => coasts.length > 20
  });

  runner.addStep({
    name: "Every beach has wet sand on the land side and foam on the water side, across chunk edges too",
    action: async () => {
      failures = [];
      const beaches = coasts.filter(
        ({ land, side }) => beachTerrains.includes(land.getTileTypes()[0]) && !land.getRiverSides()[side]
      );
      for (const { land, water, side } of beaches) {
        const sandy = anyOffSide(land, land, side, [-0.6, -1.2, -1.8], isSand);
        const foamy = anyOffSide(land, water, side, [0.6, 1.2], isFoam);
        if (sandy && foamy) continue;
        const [landX, landY] = offSide(land, side, -1.2);
        const [waterX, waterY] = offSide(land, side, 1.2);
        failures.push(
          `(${land.getGridX()},${land.getGridY()}) side ${side} ${land.getTileTypes()}: land ${pixelAt(land, landX, landY)} water ${pixelAt(water, waterX, waterY)}`
        );
      }
      const acrossChunks = beaches.filter(({ land, water }) => chunkOf(land) !== chunkOf(water)).length;
      utils.log(`${beaches.length} beach sides checked, ${acrossChunks} of them across chunk edges`);
      failures.slice(0, 5).forEach((failure) => utils.log(failure, "red"));
    },
    verification: () => failures.length === 0
  });

  runner.addStep({
    name: "Inland sides, with land on both sides, get no sand",
    action: async () => {
      failures = [];
      const inland = allTiles()
        .filter(
          (tile) => tile.getTileTypes()[0] === "grass" && tile.getAdjacentTiles().every((adj) => adj && !adj.isWater())
        )
        .slice(0, 50);
      for (const tile of inland) {
        const [x, y] = offSide(tile, 2, -1.2);
        const color = pixelAt(tile, x, y);
        if (isSand(color)) failures.push(`(${tile.getGridX()},${tile.getGridY()}): ${color}`);
      }
      utils.log(`${inland.length} inland grass tiles checked`);
    },
    verification: () => failures.length === 0
  });

  runner.addStep({
    name: "Center on a stretch of beach",
    action: async () => {
      const beachSidesAround = (tile: Tile) =>
        coasts.filter(
          ({ land }) =>
            beachTerrains.includes(land.getTileTypes()[0]) && (land === tile || land.getAdjacentTiles().includes(tile))
        ).length;
      const best = coasts.map(({ land }) => land).reduce((a, b) => (beachSidesAround(b) > beachSidesAround(a) ? b : a));
      utils.getInGameScene().focusOnTile(best, 3);
      utils.log("Pan along the coast: sand on the land, foam and shallows on the water.", "yellow");

      const results = document.getElementById("test-results");
      if (results) results.style.pointerEvents = "none";
    },
    verification: () => true
  });

  return runner;
}
