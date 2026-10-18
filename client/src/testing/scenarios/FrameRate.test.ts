import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { GameMap } from "../../map/GameMap";
import { TestUtils } from "../TestUtils";

// How fast the map draws on this computer: starts a revealed game on the Medium map, then for a few
// seconds each holds the globe still, turns it, and does the same on the flat map close in and zoomed
// out, logging the frames a second and how long the game's own code took of each frame. The rest of a
// frame is the browser and the graphics card, so a low frame rate with little of the game's time in it
// means the card is what holds it back. Also checks that a still globe, close in, isn't drawn over again.
export function setupFrameRateTest(game: Game) {
  const runner = new TestRunner("FrameRate");
  const utils = new TestUtils(game);
  const scene = () => utils.getInGameScene();
  const map = () => GameMap.getInstance();
  const SECONDS = 4;
  let center: { x: number; y: number };
  let globeDraws = 0;

  // Runs `move` every frame for a few seconds (the frame's time since starting, in seconds), and logs
  // the frame rate and the game's own time per frame.
  const measure = async (label: string, move?: (seconds: number) => void) => {
    const loop = game.gameLoop;
    let frames = 0;
    let busy = 0;
    const startedAt = performance.now();
    game.gameLoop = () => {
      move?.((performance.now() - startedAt) / 1000);
      const frameStart = performance.now();
      loop.call(game);
      busy += performance.now() - frameStart;
      frames++;
    };
    await utils.delay(SECONDS * 1000);
    game.gameLoop = loop;
    const elapsed = (performance.now() - startedAt) / 1000;
    utils.log(
      `${label}: ${(frames / elapsed).toFixed(0)} frames a second, ${(busy / Math.max(frames, 1)).toFixed(1)} ms of game code a frame`,
      "yellow"
    );
  };
  // Pans east across the map, about two screens a second at this zoom.
  const panning = (zoom: number) => (seconds: number) =>
    scene()
      .getCamera()
      .jumpToLocation(center.x + (seconds * 2 * window.innerWidth) / zoom, center.y, zoom);

  runner.addStep({
    name: "Start a revealed game on the Medium map",
    action: async () => {
      await utils.ensureInGame({ allowBarbarians: false, revealMap: true, wrapMap: true, mapSize: 3, mapPreset: "" });
      await utils.waitUntil(() => !scene()["loadingScreen"], 300000, "The map to be drawn");
      const tile = (await utils.findUnitWithAction("settle")).getTile();
      center = tile.getCenterPosition();
      utils.log(
        `Map: ${map().getWidth()} x ${map().getHeight()} tiles, window ${window.innerWidth} x ${window.innerHeight} at ${window.devicePixelRatio}x`,
        "yellow"
      );
    },
    verification: () => !!center
  });

  runner.addStep({
    name: "The globe, held still",
    action: async () => {
      await scene().setGlobeView(true);
      scene().getCamera().jumpToLocation(center.x, center.y, 1);
      await utils.delay(1500);
      await measure("Globe, still");
    },
    verification: () => true
  });

  runner.addStep({
    name: "Close in, a still globe isn't drawn over again",
    action: async () => {
      scene().getCamera().jumpToLocation(center.x, center.y, 4);
      await utils.delay(1500);
      const renderer = (scene().getCamera() as unknown as Record<string, any>)["globe"]["renderer"];
      const render = renderer.render;
      renderer.render = (...args: unknown[]) => {
        globeDraws++;
        return render.apply(renderer, args);
      };
      await utils.delay(2000);
      renderer.render = render;
      utils.log(`The globe was drawn ${globeDraws} times in 2 seconds`, "yellow");
    },
    // The sun's planets go round, but none of them is in view this close in.
    verification: () => globeDraws === 0
  });

  runner.addStep({
    name: "The globe, turning",
    action: async () => {
      scene().getCamera().jumpToLocation(center.x, center.y, 1);
      await utils.delay(1500);
      await measure("Globe, turning", panning(1));
    },
    verification: () => true
  });

  runner.addStep({
    name: "The flat map, held still",
    action: async () => {
      await scene().setGlobeView(false);
      scene().getCamera().jumpToLocation(center.x, center.y, 1);
      await utils.delay(1500);
      await measure("Flat map, still");
    },
    verification: () => true
  });

  runner.addStep({
    name: "The flat map, panning",
    action: () => measure("Flat map, panning", panning(1)),
    verification: () => true
  });

  runner.addStep({
    name: "The flat map, zoomed out and panning",
    action: () => measure("Flat map, zoomed out, panning", panning(0.3)),
    verification: () => true
  });

  runner.addStep({
    name: "Back to the globe, to look around",
    action: async () => {
      await scene().setGlobeView(true);
      scene().getCamera().jumpToLocation(center.x, center.y, 1);
    },
    verification: () => scene().isGlobeView()
  });

  return runner;
}
