import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Tile } from "../../map/Tile";
import { GameMap } from "../../map/GameMap";
import { InGameScene } from "../../scene/type/InGameScene";
import { TestUtils } from "../TestUtils";

// Starts on the tech_effects map preset (server/config/map_presets.yml) with fog of war on and every
// tech costing 1 science, so each one is researched the turn after it's chosen. Checks what
// researching a tech does to the map, as in Civ 5 Brave New World: Horses stay hidden until Animal
// Husbandry and Iron until Iron Working, and Civil Service adds 1 Food to the Farm beside the lake
// but not to the dry one. Ends zoomed in on the preset to look over by eye.
export function setupTechEffectsTest(game: Game) {
  const runner = new TestRunner("TechEffects");
  const utils = new TestUtils(game);
  let settlerTile: Tile | undefined;

  const scene = () => game.getCurrentSceneAs<InGameScene>();
  // Looked up afresh each time, since the server resends tiles once a tech changes them.
  const near = (matches: (tile: Tile) => boolean) => {
    const center = GameMap.getInstance().getTiles()[settlerTile.getGridX()][settlerTile.getGridY()];
    return utils.tilesAround(center, 0, 2).find(matches);
  };
  const has = (tile: Tile | undefined, type: string) => !!tile?.getTileTypes().includes(type);
  const horsesTile = () => near((tile) => has(tile, "plains") && !has(tile, "farm") && !has(tile, "city"));
  const ironTile = () => near((tile) => has(tile, "grass_hill"));
  const wetFarm = () => near((tile) => has(tile, "farm") && tile.getAdjacentTiles().some((adj) => has(adj, "freshwater")));
  const dryFarm = () => near((tile) => has(tile, "farm") && !tile.getAdjacentTiles().some((adj) => has(adj, "freshwater")));
  const yieldOf = (tile: Tile | undefined, stat: string) => tile?.getTileYield()?.[stat] ?? 0;

  const researchInOrder = async (techs: string[]) => {
    for (const tech of techs) {
      WebsocketClient.sendMessage({ event: "chooseResearch", techName: tech });
      WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
      await utils.waitUntil(() => utils.getClientPlayer().hasResearchedTech(tech), 5000, `${tech} to be researched`);
    }
    // The tiles a tech changed arrive right behind the research update.
    await utils.delay(500);
  };

  runner.addStep({
    name: "Start on the tech_effects map with fog of war on and 1-science techs",
    action: async () => {
      WebsocketClient.init("localhost");
      await utils.waitUntil(() => game.getCurrentScene().getName() === "lobby", 5000, "Scene to become lobby");

      const options = { mapPreset: "tech_effects", revealMap: false, allowBarbarians: false, techCostPercent: 1 };
      for (const [option, value] of Object.entries({ startingGold: 0, startWithAllTechs: false, ...options })) {
        WebsocketClient.sendMessage({ event: "setGameOption", option, value });
      }
      WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
      await utils.waitUntil(() => game.getCurrentScene().getName() === "in_game", 15000, "Scene to become in_game");

      const settler = await utils.findUnitWithAction("settle");
      settlerTile = settler.getTile();
      scene().focusOnTile(settlerTile, 4);
    },
    verification: () => !!settlerTile && !!horsesTile() && !!ironTile() && !!wetFarm() && !!dryFarm()
  });

  runner.addStep({
    name: "Before their techs, Horses and Iron are hidden and yield nothing",
    action: async () => {
      utils.log(`Horses tile: ${horsesTile().getTileTypes()} ${JSON.stringify(horsesTile().getTileYield())}`, "yellow");
      utils.log(`Iron tile: ${ironTile().getTileTypes()} ${JSON.stringify(ironTile().getTileYield())}`, "yellow");
    },
    verification: () =>
      !has(horsesTile(), "horses") &&
      yieldOf(horsesTile(), "production") === 1 &&
      !has(ironTile(), "iron") &&
      yieldOf(ironTile(), "production") === 2
  });

  runner.addStep({
    name: "Settle the city, to have science to research with",
    action: async () => {
      WebsocketClient.sendMessage({
        event: "unitAction",
        unitX: settlerTile.getGridX(),
        unitY: settlerTile.getGridY(),
        id: settlerTile.getUnits()[0].getID(),
        actionName: "settle"
      });
      await utils.waitUntil(() => utils.getClientPlayer().getCities().length > 0, 5000, "City to be founded");
    },
    verification: () => utils.getClientPlayer().getCities().length > 0
  });

  runner.addStep({
    name: "Animal Husbandry reveals the Horses, worth 1 Production",
    action: async () => researchInOrder(["Animal Husbandry"]),
    verification: () => has(horsesTile(), "horses") && yieldOf(horsesTile(), "production") === 2 && !has(ironTile(), "iron")
  });

  runner.addStep({
    name: "Iron Working reveals the Iron, worth 1 Production",
    action: async () => researchInOrder(["Mining", "Bronze Working", "Iron Working"]),
    verification: () => has(ironTile(), "iron") && yieldOf(ironTile(), "production") === 3
  });

  runner.addStep({
    name: "Civil Service adds 1 Food to the Farm beside the lake, not to the dry one",
    action: async () => {
      const wetBefore = yieldOf(wetFarm(), "food");
      const dryBefore = yieldOf(dryFarm(), "food");
      utils.log(`Before: lake Farm ${wetBefore} Food, dry Farm ${dryBefore} Food`, "yellow");
      await researchInOrder([
        "Pottery",
        "Writing",
        "Drama and Poetry",
        "Archery",
        "The Wheel",
        "Trapping",
        "Horseback Riding",
        "Mathematics",
        "Currency",
        "Civil Service"
      ]);
      utils.log(`After: lake Farm ${yieldOf(wetFarm(), "food")} Food, dry Farm ${yieldOf(dryFarm(), "food")} Food`, "yellow");
    },
    verification: () => yieldOf(wetFarm(), "food") === 4 && yieldOf(dryFarm(), "food") === 2
  });

  runner.addStep({
    name: "Zoom in on the preset to look over by eye",
    action: async () => {
      scene().focusOnTile(settlerTile, 4);
      await utils.delay(500);
    },
    verification: () => true
  });

  return runner;
}
