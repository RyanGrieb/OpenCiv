import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { GameMap } from "../../map/GameMap";
import { Tile } from "../../map/Tile";
import { Unit } from "../../Unit";
import { GlobeProjection } from "../../globe/GlobeProjection";
import { TestUtils } from "../TestUtils";

// The globe with depth: what stands up off the map - trees, mountains' peaks, resources, cities,
// units and their badges, city banners - stands up off the globe too, rather than lying flat on it,
// so the world keeps its height toward the horizon and around the planet's edge. Starts an unexplored
// game on the Medium map, founds a city, and looks at it on the globe from close up, tilted toward
// the horizon: checks that the map's sprites and the city's banner stand, that toward the planet's
// edge the warrior stands straight out of the ground yet never hangs upside down below its middle,
// that the mouse finds the warrior and the banner where they stand, that the fog of war shades what
// stands in it, and that a still view doesn't draw the map over again. Ends there to look around:
// drag, scroll, G for flat.
export function setupGlobeDepthTest(game: Game) {
  const runner = new TestRunner("GlobeDepth");
  const utils = new TestUtils(game);
  const scene = () => utils.getInGameScene();
  const globe = () => (scene().getCamera() as unknown as Record<string, any>)["globe"];
  const sprites = () => globe()["sprites"];
  const standing = (object: unknown) =>
    (sprites()["standing"] as { object: unknown }[]).some((entry) => entry.object === object);
  const clientPlayer = () => utils.getClientPlayer() as unknown as Record<string, any>;
  const hoveredTile = (): Tile | undefined => clientPlayer()["hoveredTile"]?.getRepresentedTile();
  const mouse = (type: string, [clientX, clientY]: number[], options: MouseEventInit = {}) =>
    game.getCanvas().dispatchEvent(new MouseEvent(type, { clientX, clientY, bubbles: true, ...options }));
  const nameLabel = () => (cityTile?.getCity() as unknown as Record<string, any>)?.["nameLabel"];
  // How often each of the globe's pictures has been handed to the GPU.
  const uploads = () => [
    globe()["ground"].terrain.texture.version,
    globe()["ground"].overlay.texture.version,
    sprites()["labels"].texture.version,
    sprites()["pieces"].atlas.texture.version
  ];
  // Close in over a tile, tilted toward the horizon, then lets a few frames draw.
  const lookAt = async (tile: Tile) => {
    scene().getCamera().jumpToLocation(tile.getCenterPosition().x, tile.getCenterPosition().y, 8);
    await utils.delay(1500);
  };
  // Looks straight down at the whole planet over the point `angle` radians from the warrior to its
  // west or north - putting the warrior toward the planet's east edge, or below its middle. Not past
  // the north pole, where the camera stops.
  const lookFromThe = async (way: "west" | "north", angle: number) => {
    const center = warrior.getTile().getCenterPosition();
    const [longitude, latitude] = globe().projection.toSphere(center.x, center.y);
    if (way === "north") angle = Math.min(angle, 1.3 - latitude);
    const toward =
      way === "west"
        ? [-Math.cos(longitude), 0, Math.sin(longitude)]
        : [-Math.sin(latitude) * Math.sin(longitude), Math.cos(latitude), -Math.sin(latitude) * Math.cos(longitude)];
    const point = GlobeProjection.unitVector(longitude, latitude).map(
      (value, axis) => value * Math.cos(angle) + toward[axis] * Math.sin(angle)
    );
    const pointLatitude = Math.asin(point[1]);
    const [x, y] = globe().projection.toWorld(Math.atan2(point[0], point[2]), pointLatitude);
    // As far out wherever it looks from as the flat map's zoom of 0.9 is at the equator.
    scene()
      .getCamera()
      .jumpToLocation(x, y, 0.9 * Math.cos(pointLatitude));
    await utils.delay(1500);
  };
  // How the warrior stands on screen, from the bottom of its picture to the top, and the way from the
  // middle of the screen out to its feet - the way out from the planet's middle, looking straight down.
  const warriorStanding = () => {
    const top = globe().screenPointOf(warrior, 0.5, 0);
    const bottom = globe().screenPointOf(warrior, 0.5, 1);
    if (!top || !bottom) return undefined;
    return {
      up: [top[0] - bottom[0], top[1] - bottom[1]],
      out: [bottom[0] - window.innerWidth / 2, bottom[1] - window.innerHeight / 2]
    };
  };
  const degreesBetween = ([ax, ay]: number[], [bx, by]: number[]) =>
    (Math.acos((ax * bx + ay * by) / Math.hypot(ax, ay) / Math.hypot(bx, by)) * 180) / Math.PI;
  let settler: Unit;
  let warrior: Unit;
  let cityTile: Tile;
  let warriorHead: number[] | undefined;
  let atEdge: { up: number[]; out: number[] } | undefined;
  let belowMiddle: { up: number[]; out: number[] } | undefined;
  let uploadsBefore: number[] = [];

  runner.addStep({
    name: "Start an unexplored game on the Medium map, which wraps east-west",
    action: async () => {
      await utils.ensureInGame({ allowBarbarians: false, revealMap: false, wrapMap: true, mapSize: 3, mapPreset: "" });
      await utils.waitUntil(() => !scene()["loadingScreen"], 300000, "The map to be drawn");
      settler = await utils.findUnitWithAction("settle");
      warrior = utils
        .getClientPlayer()
        .getUnits()
        .find((unit: Unit) => unit !== settler);
      cityTile = settler.getTile();
    },
    verification: () => !!settler && !!warrior
  });

  runner.addStep({
    name: "Found a city with the settler",
    action: async () => {
      WebsocketClient.sendMessage({
        event: "unitAction",
        unitX: cityTile.getGridX(),
        unitY: cityTile.getGridY(),
        id: settler.getID(),
        actionName: "settle"
      });
      await utils.waitUntil(() => !!nameLabel(), 10000, "The city and its banner");
    },
    verification: () => !!nameLabel()
  });

  runner.addStep({
    name: "On the globe, close to the city and tilted toward the horizon, the map's sprites and the city's banner stand up",
    action: async () => {
      await scene().setGlobeView(true);
      await lookAt(cityTile);
      utils.log(`${sprites()["mapBillboards"].length} pieces of the map's sprites stand on the globe`, "yellow");
    },
    verification: () => sprites()["mapBillboards"].length > 0 && standing(nameLabel()) && standing(warrior)
  });

  runner.addStep({
    name: "Near the planet's edge the warrior stands straight out of the ground; below its middle it still stands up",
    action: async () => {
      await lookFromThe("west", 1.15);
      atEdge = warriorStanding();
      await lookFromThe("north", 0.9);
      belowMiddle = warriorStanding();
      if (atEdge && belowMiddle) {
        utils.log(
          `At the edge it leans ${Math.round(degreesBetween(atEdge.up, [0, -1]))} degrees from upright; ` +
            `below the middle, ${Math.round(degreesBetween(belowMiddle.up, [0, -1]))}`,
          "yellow"
        );
      }
      await lookAt(cityTile);
    },
    // At the edge, out from the planet's middle (upward, should the edge be below it); below the
    // middle, head over feet.
    verification: () =>
      !!atEdge &&
      degreesBetween(atEdge.up, [atEdge.out[0], -Math.abs(atEdge.out[1])]) < 20 &&
      !!belowMiddle &&
      belowMiddle.out[1] > 0 &&
      belowMiddle.up[1] < 0
  });

  runner.addStep({
    name: "The mouse on the warrior's head, where it stands up, hovers the warrior's tile",
    action: async () => {
      if (clientPlayer()["selectedUnit"]) utils.getClientPlayer().unselectUnit();
      warriorHead = globe().screenPointOf(warrior, 0.5, 0.2);
      if (warriorHead) mouse("mousemove", warriorHead);
      await utils.delay(300);
    },
    verification: () => !!warriorHead && hoveredTile() === warrior.getTile()
  });

  runner.addStep({
    name: "Clicking it there selects the warrior",
    action: async () => {
      mouse("mousedown", warriorHead, { button: 0 });
      mouse("mouseup", warriorHead, { button: 0 });
      await utils.delay(300);
    },
    verification: () => clientPlayer()["selectedUnit"] === warrior
  });

  runner.addStep({
    name: "Clicking the city's banner, where it stands over the city, opens the city",
    action: async () => {
      utils.getClientPlayer().unselectUnit();
      const banner = globe().screenPointOf(nameLabel(), 0.5, 0.5);
      if (!banner) return;

      mouse("mousemove", banner);
      await utils.delay(200);
      mouse("mousedown", banner, { button: 0 });
      mouse("mouseup", banner, { button: 0 });
      await utils.delay(500);
    },
    verification: () => !!scene()["cityDisplayInfo"]
  });

  runner.addStep({
    name: "Walking the warrior off, what it no longer sees falls into the fog of war, which shades what stands there too",
    action: async () => {
      scene().toggleCityUI();
      const endTurn = async () => {
        WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
        await utils.delay(800);
      };
      // To the far side of the city, out of sight of the tiles past the side it started on.
      const farSide = utils.tilesAround(warrior.getTile(), 3, 3);
      const destinations = utils.tilesAround(cityTile, 2, 2).filter((tile) => farSide.includes(tile));
      await utils.walkTo(
        warrior,
        () => destinations,
        (data) => WebsocketClient.sendMessage(data),
        endTurn
      );
      await lookAt(cityTile);
    },
    // Some of what was in sight is fogged now (how many of the map's sprites stand there depends on
    // the map), and each piece takes on the fog's color and thickness at its foot, hidden by thick clouds.
    verification: () => {
      const fog = GameMap.getInstance().getFogOfWar();
      const thicknessAt = (x: number, y: number) => fog.getPixelAt(x, y)[3] / 255;
      const fogged = GameMap.getInstance()
        .getTiles()
        .flat()
        .filter((tile) => tile)
        .some((tile) => {
          const thickness = thicknessAt(tile.getCenterPosition().x, tile.getCenterPosition().y);
          return thickness > 0 && thickness <= 0.75;
        });
      const pieces = sprites()["mapBillboards"] as { footX: number; footY: number; tint: number[] }[];
      const tinted = pieces.every(({ footX, footY, tint }) => {
        const thickness = thicknessAt(footX, footY - 1);
        return thickness > 0.75 ? tint[3] < 0 : Math.abs(tint[3] - thickness) < 0.01;
      });
      const shaded = pieces.filter(({ tint }) => tint[3] > 0).length;
      utils.log(`${shaded} of ${pieces.length} pieces of the map's sprites in the fog of war`, "yellow");
      return fogged && tinted;
    }
  });

  runner.addStep({
    name: "Holding still, the globe draws nothing over again",
    action: async () => {
      // Once the warrior's walk and what it uncovered have finished drawing: the map's chunks redrawn
      // around the tiles it found (queued one after another, see GameMap.enqueueRender()), then the
      // globe's pictures of them, unchanged for a while.
      const map = GameMap.getInstance() as unknown as Record<string, Promise<void>>;
      for (let queue = map["renderQueue"]; ; queue = map["renderQueue"]) {
        await queue;
        if (map["renderQueue"] === queue) break;
      }
      let last = "";
      let changedAt = Date.now();
      await utils.waitUntil(
        () => {
          if (uploads().join() !== last) [last, changedAt] = [uploads().join(), Date.now()];
          return Date.now() - changedAt >= 1500;
        },
        30000,
        "The map to settle"
      );
      uploadsBefore = uploads();
      await utils.delay(3000);
    },
    verification: () => {
      const names = ["terrain", "ground overlay", "units and labels", "map sprites"];
      const redrawn = names.filter((name, index) => uploads()[index] !== uploadsBefore[index]);
      if (redrawn.length > 0) utils.log(`Drawn again: ${redrawn.join(", ")}`, "yellow");
      return redrawn.length === 0;
    }
  });

  return runner;
}
