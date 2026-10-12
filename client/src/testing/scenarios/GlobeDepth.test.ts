import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { GameMap } from "../../map/GameMap";
import { Tile } from "../../map/Tile";
import { Unit } from "../../Unit";
import { TestUtils } from "../TestUtils";

// The globe with depth: what stands up off the map - trees, mountains' peaks, resources, cities,
// units and their badges, city banners - stands up off the globe too, rather than lying flat on it,
// so the world keeps its height toward the horizon and around the planet's edge. Starts an unexplored
// game on the Medium map, founds a city, and looks at it on the globe from close up, tilted toward
// the horizon: checks that the map's sprites and the city's banner stand, that the mouse finds the
// warrior and the banner where they stand, that the fog of war shades what stands in it, and that a
// still view doesn't draw the map over again. Ends there to look around: drag, scroll, G for flat.
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
  let settler: Unit;
  let warrior: Unit;
  let cityTile: Tile;
  let warriorHead: number[] | undefined;
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
    // Each piece takes on the fog's color and thickness at its foot, and thick clouds hide it.
    verification: () => {
      const fog = GameMap.getInstance().getFogOfWar();
      const pieces = sprites()["mapBillboards"] as { footX: number; footY: number; tint: number[] }[];
      const tinted = pieces.every(({ footX, footY, tint }) => {
        const thickness = fog.getPixelAt(footX, footY - 1)[3] / 255;
        return thickness > 0.75 ? tint[3] < 0 : Math.abs(tint[3] - thickness) < 0.01;
      });
      const shaded = pieces.filter(({ tint }) => tint[3] > 0).length;
      utils.log(`${shaded} of ${pieces.length} pieces of the map's sprites in the fog of war`, "yellow");
      return tinted && shaded > 0;
    }
  });

  runner.addStep({
    name: "Holding still, the globe draws nothing over again",
    action: async () => {
      // Once the warrior's walk and what it uncovered have finished drawing.
      let last = "";
      await utils.waitUntil(
        () => {
          const settled = uploads().join() === last;
          last = uploads().join();
          return settled;
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
