import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { GameMap } from "../../map/GameMap";
import { FogOfWarLayer } from "../../map/FogOfWarLayer";
import { Tile } from "../../map/Tile";
import { Unit } from "../../Unit";
import { TestUtils } from "../TestUtils";

// Fog of war fades between unexplored, remembered and visible tiles instead of stopping at hard hex
// edges. Starts a normal fogged game, samples the fog overlay across the edge of sight, then walks a
// unit away so some tiles fall back into fog, and checks those read as dimmed rather than hidden.
export function setupSoftFogOfWarTest(game: Game) {
  const runner = new TestRunner("SoftFogOfWar");
  const utils = new TestUtils(game);
  const map = () => GameMap.getInstance();
  const fog = () => map().getFogOfWar();
  // Neighbor offsets by row parity, as GameMap's evenEdgeAxis/oddEdgeAxis: odd rows sit half a tile right.
  const evenRowNeighbors = [
    [-1, -1],
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 1],
    [-1, 0]
  ];
  const oddRowNeighbors = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 0]
  ];

  const knownTiles = () =>
    map()
      .getTiles()
      .flat()
      .filter((tile) => !!tile);
  const centerOf = (gridX: number, gridY: number) => ({
    x: gridX * 32 + (gridY % 2 !== 0 ? 16 : 0) + 16,
    y: gridY * 25 + 16
  });
  const neighborCoords = (tile: Tile) =>
    (tile.getGridY() % 2 !== 0 ? oddRowNeighbors : evenRowNeighbors)
      .map(([dx, dy]) => ({ x: tile.getGridX() + dx, y: tile.getGridY() + dy }))
      .filter((coord) => coord.x >= 0 && coord.y >= 0 && coord.x < map().getWidth() && coord.y < map().getHeight());
  const stateOf = (coord: { x: number; y: number }) => fog().getTileState(coord.x, coord.y);
  const alphaAt = (x: number, y: number) => fog().getPixelAt(x, y)[3] / 255;

  // A visible tile touching an unexplored one, and that unexplored neighbor.
  let edge: { visible: Tile; unexplored: { x: number; y: number } } | undefined;
  let samples: number[] = [];
  let scout: Unit | undefined;
  let foggedTile: Tile | undefined;

  runner.addStep({
    name: "Start a fogged game: the starting tiles are visible, the rest of the map unexplored",
    action: async () => {
      await utils.ensureInGame({ allowBarbarians: false, revealMap: false });
      await utils.waitUntil(() => !!fog() && knownTiles().length > 5, 10000, "The starting tiles to arrive");
      await utils.delay(500);
      const visible = knownTiles().filter(
        (tile) => stateOf({ x: tile.getGridX(), y: tile.getGridY() }) === FogOfWarLayer.VISIBLE
      );
      utils.log(`${visible.length} visible tiles of ${map().getWidth() * map().getHeight()}`);
    },
    verification: () => {
      const unit = utils.getClientPlayer().getUnits()[0];
      const unitTile = unit.getTile();
      return (
        stateOf({ x: unitTile.getGridX(), y: unitTile.getGridY() }) === FogOfWarLayer.VISIBLE &&
        knownTiles().length < map().getWidth() * map().getHeight()
      );
    }
  });

  runner.addStep({
    name: "Across the edge of sight the fog ramps up gradually instead of switching at the hex edge",
    action: async () => {
      for (const tile of knownTiles()) {
        if (stateOf({ x: tile.getGridX(), y: tile.getGridY() }) !== FogOfWarLayer.VISIBLE) continue;
        // Straight east or west, so the samples cross the hex's side rather than clip a corner.
        const unexplored = neighborCoords(tile).find(
          (coord) => coord.y === tile.getGridY() && stateOf(coord) === FogOfWarLayer.UNEXPLORED
        );
        if (!unexplored) continue;
        edge = { visible: tile, unexplored };
        break;
      }
      if (!edge) throw new Error("No visible tile next to an unexplored one");

      const from = centerOf(edge.visible.getGridX(), edge.visible.getGridY());
      const to = centerOf(edge.unexplored.x, edge.unexplored.y);
      samples = [];
      for (let step = 0; step <= 20; step++) {
        samples.push(alphaAt(from.x + ((to.x - from.x) * step) / 20, from.y + ((to.y - from.y) * step) / 20));
      }
      utils.log(`Fog opacity from visible to unexplored: ${samples.map((alpha) => alpha.toFixed(2)).join(" ")}`);
      utils.getInGameScene().focusOnTile(edge.visible, 3);
    },
    verification: () => {
      const inBetween = samples.filter((alpha) => alpha > 0.1 && alpha < 0.9).length;
      const neverDrops = samples.every((alpha, index) => index === 0 || alpha >= samples[index - 1] - 0.02);
      return samples[0] < 0.5 && samples[20] > 0.9 && inBetween >= 2 && neverDrops;
    }
  });

  runner.addStep({
    name: "The middle of what the units can see stays clear",
    action: async () => {},
    verification: () => {
      const unitTile = utils.getClientPlayer().getUnits()[0].getTile();
      const center = unitTile.getCenterPosition();
      utils.log(`Fog opacity on the first unit's tile: ${alphaAt(center.x, center.y).toFixed(2)}`);
      return alphaAt(center.x, center.y) < 0.15;
    }
  });

  runner.addStep({
    name: "Walk a unit away until tiles it saw fall back into fog",
    action: async () => {
      const units = utils.getClientPlayer().getUnits();
      scout =
        units.find((unit) => !unit.getActions().some((action) => action.getName().toLowerCase().includes("settle"))) ??
        units[0];
      const start = scout.getTile();
      const endTurn = async () => {
        WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
        await utils.delay(600);
      };

      for (let attempt = 0; attempt < 3 && !foggedTile; attempt++) {
        const from = scout.getTile();
        await utils.walkTo(
          scout,
          () => utils.tilesAround(from, 2, 3),
          WebsocketClient.sendMessage.bind(WebsocketClient),
          endTurn
        );
        await utils.delay(500);
        foggedTile = knownTiles().find(
          (tile) =>
            stateOf({ x: tile.getGridX(), y: tile.getGridY() }) === FogOfWarLayer.FOGGED &&
            neighborCoords(tile).every((coord) => stateOf(coord) !== FogOfWarLayer.UNEXPLORED)
        );
      }
      utils.log(
        `Walked the ${scout.getName()} from ${start.getGridX()},${start.getGridY()} to ${scout.getTile().getGridX()},${scout.getTile().getGridY()}`
      );
      if (foggedTile) utils.getInGameScene().focusOnTile(foggedTile, 3);
    },
    verification: () => !!foggedTile
  });

  runner.addStep({
    name: "A remembered tile is dimmed, not hidden: partly see-through and dark rather than the unexplored gray",
    action: async () => {},
    verification: () => {
      const center = foggedTile.getCenterPosition();
      const [red, , , alpha] = fog().getPixelAt(center.x, center.y);
      utils.log(
        `Remembered tile ${foggedTile.getGridX()},${foggedTile.getGridY()}: opacity ${(alpha / 255).toFixed(2)}, red ${red}`
      );
      return alpha / 255 > 0.2 && alpha / 255 < 0.75 && red < 100;
    }
  });

  return runner;
}
