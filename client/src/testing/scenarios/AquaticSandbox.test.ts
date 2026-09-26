import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { InGameScene } from "../../scene/type/InGameScene";
import { TestUtils } from "../TestUtils";

// Not a test: starts on the aquatic_sandbox map preset (server/config/map_presets.yml), a coastal
// spot with sea resources in the first two rings, three Work Boats and a Galley, with every tech
// researched, then hands it over to play by hand.
export function setupAquaticSandboxTest(game: Game) {
  const runner = new TestRunner("AquaticSandbox");
  const utils = new TestUtils(game);
  let settler: Unit | undefined;

  runner.addStep({
    name: "Start on the aquatic_sandbox map with every tech",
    action: async () => {
      WebsocketClient.init("localhost");
      await utils.waitUntil(() => game.getCurrentScene().getName() === "lobby", 5000, "Scene to become lobby");

      WebsocketClient.sendMessage({ event: "setGameOption", option: "mapPreset", value: "aquatic_sandbox" });
      for (const option of ["revealMap", "startWithAllTechs"]) {
        WebsocketClient.sendMessage({ event: "setGameOption", option, value: true });
      }
      WebsocketClient.sendMessage({ event: "setGameOption", option: "allowBarbarians", value: false });
      WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
      await utils.waitUntil(() => game.getCurrentScene().getName() === "in_game", 15000, "Scene to become in_game");
    },
    verification: () => game.getCurrentScene().getName() === "in_game"
  });

  runner.addStep({
    name: "Center on your Settler",
    action: async () => {
      settler = await utils.findUnitWithAction("settle");
      game.getCurrentSceneAs<InGameScene>().focusOnTile(settler.getTile(), 4);

      utils.log("Settle first: Fishing Boats only go inside your borders, so the", "yellow");
      utils.log("turtles and pearls further out wait for them to grow. Sail a Work", "yellow");
      utils.log("Boat onto a resource and press Build Fishing Boats. The Galley keeps to", "yellow");
      utils.log("the coast, and coastal cities can build more ships.", "yellow");

      // Let clicks through to the map wherever this log sits.
      const results = document.getElementById("test-results");
      if (results) results.style.pointerEvents = "none";
    },
    verification: () => !!settler
  });

  return runner;
}
