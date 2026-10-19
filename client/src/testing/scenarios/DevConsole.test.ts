import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { Tile } from "../../map/Tile";
import { Unit } from "../../Unit";
import { TestUtils } from "../TestUtils";

// The developer console: ` opens it, "spawn archer" waits for a tile, and the next left click on the
// map puts an Archer there. Ends with the console open, for trying other commands (type help). Needs
// a server in developer mode: npm run try -- <branch> --dev.
export function setupDevConsoleTest(game: Game) {
  const runner = new TestRunner("DevConsole");
  const utils = new TestUtils(game);
  const scene = () => utils.getInGameScene();
  const devConsole = () => scene().getDevConsole();
  const output = (): string[] => (devConsole() as unknown as Record<string, string[]>)?.["output"] ?? [];
  const press = (key: string) => {
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
  };
  const type = (text: string) => [...text].forEach(press);
  let target: Tile;
  let settler: Unit;

  runner.addStep({
    name: "Start a game",
    action: async () => {
      // Gold for the extra unit's upkeep, so it isn't disbanded for debt.
      await utils.ensureInGame({ allowBarbarians: false, startingGold: 100 });
      settler = await utils.findUnitWithAction("settle");
      scene().focusOnTile(settler.getTile(), 3);
    },
    verification: () => !!settler
  });

  runner.addStep({
    name: "` opens the console",
    action: async () => {
      press("`");
      await utils.delay(100);
    },
    verification: () => !!devConsole()?.isOpen()
  });

  runner.addStep({
    name: "spawn archer asks for a tile",
    action: async () => {
      type("spawn archer");
      press("Enter");
      await utils.waitUntil(() => output().some((line) => line.includes("Left click")), 5000, "The server to answer");
    },
    verification: () => output().some((line) => line.includes("Archer"))
  });

  runner.addStep({
    name: "Escape closes the console, without opening the game menu",
    action: async () => {
      press("Escape");
      await utils.delay(100);
    },
    verification: () => !devConsole().isOpen() && !scene()["openUIElement"]
  });

  runner.addStep({
    name: "Left clicking a free tile spawns the Archer there",
    action: async () => {
      target = utils.nearestFreeTile(settler, utils.tilesAround(settler.getTile(), 2, 2));
      const clientPlayer = utils.getClientPlayer() as unknown as Record<string, any>;
      clientPlayer["hoveredTile"].setRepresentedTile(target);
      const { innerWidth, innerHeight } = window;
      game
        .getCanvas()
        .dispatchEvent(new MouseEvent("mouseup", { button: 0, clientX: innerWidth / 2, clientY: innerHeight / 2 }));
      await utils.waitUntil(
        () => target.getUnits().some((unit) => unit.getName() === "Archer"),
        5000,
        "The Archer to appear"
      );
    },
    verification: () => target.getUnits().some((unit) => unit.getName() === "Archer")
  });

  runner.addStep({
    name: "` opens the console again, saying where the Archer went",
    action: async () => {
      press("`");
      await utils.delay(100);
    },
    verification: () => devConsole().isOpen() && output().some((line) => line.startsWith("Spawned the Archer"))
  });

  return runner;
}
