import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { HexSphere } from "../../globe/HexSphere";
import { GameMap } from "../../map/GameMap";
import { Tile } from "../../map/Tile";
import { TestUtils } from "../TestUtils";

// The map as a globe: the flat map wrapped around a hex planet whose twelve pentagons sit around the
// poles, six at each, inside a small solar system. Starts a revealed game on the Medium (Standard)
// map, switches to the globe (real games start on it), checks that the tile under the mouse and
// clicks go through the globe, flies out to the solar system, switches to the flat map and back, and
// ends zoomed in on the settler to look around: drag to spin, scroll to zoom, G for the flat map.
export function setupGlobeMapTest(game: Game) {
  const runner = new TestRunner("GlobeMap");
  const utils = new TestUtils(game);
  const scene = () => utils.getInGameScene();
  const map = () => GameMap.getInstance();
  const clientPlayer = () => utils.getClientPlayer() as unknown as Record<string, any>;
  const hoveredTile = (): Tile | undefined => clientPlayer()["hoveredTile"]?.getRepresentedTile();
  const globeCanvas = () => document.getElementById("globe-canvas");
  const middle = () => ({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
  const mouse = (type: string, options: MouseEventInit = {}) =>
    game.getCanvas().dispatchEvent(new MouseEvent(type, { ...middle(), bubbles: true, ...options }));
  const distanceToSettler = (point: [number, number] | undefined) => {
    if (!point) return Infinity;
    const center = settlerTile.getCenterPosition();
    const dx = Math.abs(point[0] - center.x) % (map().getWidth() * 32);
    return Math.hypot(Math.min(dx, map().getWidth() * 32 - dx), point[1] - center.y);
  };
  let settlerTile: Tile;
  let pentagonRows: number[] = [];

  runner.addStep({
    name: "Start a revealed game on the Medium map, which wraps east-west",
    action: async () => {
      await utils.ensureInGame({ allowBarbarians: false, revealMap: true, wrapMap: true, mapSize: 3, mapPreset: "" });
      // The whole revealed map is drawn before the game starts, which takes a while.
      await utils.waitUntil(() => !scene()["loadingScreen"], 300000, "The map to be drawn");
      settlerTile = (await utils.findUnitWithAction("settle")).getTile();
      utils.log(`Map: ${map().getWidth()} x ${map().getHeight()} tiles`, "yellow");
    },
    verification: () => map().getWidth() === 84 && map().getHeight() === 56
  });

  runner.addStep({
    name: "The map closes into a globe with six pentagons around each pole, in its top and bottom rows",
    action: () => {
      const capRows = map().getWidth() / 6;
      const sphere = HexSphere.polarCapsule(capRows, map().getHeight());
      pentagonRows = sphere.pentagons.map((tile) => sphere.rows[tile] - capRows);
      utils.log(`${sphere.tileCount} tiles on the globe; pentagons in map rows ${pentagonRows.join(", ")}`, "yellow");
    },
    verification: () =>
      pentagonRows.length === 12 &&
      pentagonRows.filter((row) => row === 0).length === 6 &&
      pentagonRows.filter((row) => row === map().getHeight() - 1).length === 6
  });

  runner.addStep({
    name: "Switch to the globe, drawn behind a see-through game canvas",
    action: async () => {
      await scene().setGlobeView(true);
      await utils.delay(800);
    },
    verification: () =>
      scene().isGlobeView() && globeCanvas()?.style.display !== "none" && scene().getCamera().rendersWorldOffscreen()
  });

  runner.addStep({
    name: "Flying to the settler puts it in the middle of the screen",
    action: async () => {
      scene().focusOnTile(settlerTile, 3);
      const { clientX, clientY } = middle();
      await utils.waitUntil(
        () => distanceToSettler(scene().getCamera().screenToWorld(clientX, clientY)) < 4,
        20000,
        "The camera to arrive"
      );
      const ground = scene().getCamera().screenToWorld(clientX, clientY);
      utils.log(
        `Middle of the screen: world ${ground?.map(Math.round)}, ${distanceToSettler(ground).toFixed(1)} px from the settler`,
        "yellow"
      );
    },
    verification: () => {
      const { clientX, clientY } = middle();
      return distanceToSettler(scene().getCamera().screenToWorld(clientX, clientY)) < 4;
    }
  });

  runner.addStep({
    name: "The mouse over the settler hovers its tile, through the globe",
    action: async () => {
      mouse("mousemove");
      await utils.delay(200);
    },
    verification: () => hoveredTile() === settlerTile
  });

  runner.addStep({
    name: "Clicking it there selects the settler",
    action: async () => {
      if (clientPlayer()["selectedUnit"]) utils.getClientPlayer().unselectUnit();
      mouse("mousedown", { button: 0 });
      mouse("mouseup", { button: 0 });
      await utils.delay(300);
    },
    verification: () => clientPlayer()["selectedUnit"]?.getTile() === settlerTile
  });

  runner.addStep({
    name: "Off the edge of the globe, no tile is hovered",
    action: async () => {
      for (let i = 0; i < 12; i++)
        game.getCanvas().dispatchEvent(new WheelEvent("wheel", { ...middle(), deltaY: 100 }));
      await utils.delay(1500);
      mouse("mousemove", { clientX: 4, clientY: 4 });
      await utils.delay(200);
    },
    verification: () => !scene().getCamera().screenToWorld(4, 4) && !hoveredTile()
  });

  runner.addStep({
    name: "Zoom out past the planet to the solar system",
    action: async () => {
      for (let i = 0; i < 30; i++)
        game.getCanvas().dispatchEvent(new WheelEvent("wheel", { ...middle(), deltaY: 100 }));
      await utils.waitUntil(() => scene().getCamera().getZoomAmount() < 0.02, 20000, "The camera to fly out");
      utils.log(`Zoom out there: ${scene().getCamera().getZoomAmount().toFixed(4)} of the flat map's`, "yellow");
    },
    verification: () => scene().getCamera().getZoomAmount() < 0.02
  });

  runner.addStep({
    name: "G's switch to the flat map comes back at a usable zoom, over the same place, and hides the globe",
    action: async () => {
      await scene().setGlobeView(false);
      await utils.delay(500);
    },
    verification: () => {
      const camera = scene().getCamera();
      return !scene().isGlobeView() && globeCanvas()?.style.display === "none" && camera.getZoomAmount() >= 1;
    }
  });

  runner.addStep({
    name: "Back on the globe, zoomed in on the settler to look around",
    action: async () => {
      await scene().setGlobeView(true);
      scene().focusOnTile(settlerTile, 3);
      const { clientX, clientY } = middle();
      await utils.waitUntil(
        () => distanceToSettler(scene().getCamera().screenToWorld(clientX, clientY)) < 4,
        20000,
        "The camera to arrive"
      );
    },
    verification: () => scene().isGlobeView()
  });

  return runner;
}
