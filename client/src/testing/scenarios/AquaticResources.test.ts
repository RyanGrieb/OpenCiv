import { TestRunner } from "../TestRunner";
import { SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { Tile } from "../../map/Tile";
import { GameMap } from "../../map/GameMap";
import { InGameScene } from "../../scene/type/InGameScene";
import { TestUtils } from "../TestUtils";

// Starts on the coastal_resources map preset (server/config/map_presets.yml): a coastal spot with
// fish, crab, whales, turtles and pearls around the Settler and a Work Boat beside each. It settles,
// checks ships and land units keep to their own element, has each Work Boat build Fishing Boats
// through the unit info window, then builds one more Work Boat in the city.
export function setupAquaticResourcesTest(game: Game) {
  const runner = new TestRunner("AquaticResources");
  const utils = new TestUtils(game);
  const SEA_RESOURCES = ["fish", "crab", "whales", "turtles", "pearls"];
  let settlerTile: Tile | undefined;
  let productionOptions: string[] = [];

  const clientPlayer = () => utils.getClientPlayer() as unknown as Record<string, any>;
  const scene = () => game.getCurrentSceneAs<InGameScene>();
  const workBoats = () =>
    utils
      .getClientPlayer()
      .getUnits()
      .filter((unit) => unit.getName() === "Work Boat");
  const city = () => utils.getClientPlayer().getCities()[0];
  const cityScreen = () => scene()["cityDisplayInfo"] as Record<string, any> | undefined;
  const resourceTile = (resource: string) =>
    settlerTile.getAdjacentTiles().find((tile) => tile?.getTileTypes().includes(resource));

  const select = (unit: Unit) => {
    for (let click = 0; click < 4 && clientPlayer()["selectedUnit"] !== unit; click++) {
      clientPlayer()["onClickedTileWithUnit"](unit.getTile());
    }
    if (clientPlayer()["selectedUnit"] !== unit) throw new Error(`Couldn't select ${unit.getName()}`);
  };

  // Presses the action's button in the unit info window, the way a player would.
  const pressAction = async (unit: Unit, actionName: string) => {
    select(unit);
    const buttons = (): Record<string, any>[] => unit["unitDisplayInfo"]?.["actionButtons"] ?? [];
    const shown = () => unit.getActions().filter((action) => action.requirementsMet(unit));
    await utils.waitUntil(
      () => buttons().length > 0 && buttons().length === shown().length,
      3000,
      "Action buttons to show"
    );

    const index = shown().findIndex((action) => action.getName() === actionName);
    if (index === -1) throw new Error(`${actionName} isn't offered here`);
    buttons()[index]["callbackFunction"]();
  };

  const moveUnit = (unit: Unit, target: Tile) =>
    WebsocketClient.sendMessage({
      event: "moveUnit",
      unitX: unit.getTile().getGridX(),
      unitY: unit.getTile().getGridY(),
      id: unit.getID(),
      targetX: target.getGridX(),
      targetY: target.getGridY()
    });

  const shoreBeside = (tile: Tile) =>
    tile.getAdjacentTiles().find((neighbor) => neighbor && !neighbor.isWater() && !neighbor.getCity());

  const hasPath = (unit: Unit, target: Tile) =>
    GameMap.getInstance().constructShortestPath(unit, unit.getTile(), target).length > 0;

  runner.addStep({
    name: "Start on the coastal_resources map: one of each sea resource beside the Settler",
    action: async () => {
      WebsocketClient.init("localhost");
      await utils.waitUntil(() => game.getCurrentScene().getName() === "lobby", 5000, "Scene to become lobby");

      WebsocketClient.sendMessage({ event: "setGameOption", option: "mapPreset", value: "coastal_resources" });
      for (const option of ["revealMap", "startWithAllTechs"]) {
        WebsocketClient.sendMessage({ event: "setGameOption", option, value: true });
      }
      WebsocketClient.sendMessage({ event: "setGameOption", option: "allowBarbarians", value: false });
      WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
      await utils.waitUntil(() => game.getCurrentScene().getName() === "in_game", 15000, "Scene to become in_game");

      const settler = await utils.findUnitWithAction("settle");
      settlerTile = settler.getTile();
      await utils.waitUntil(() => workBoats().length === SEA_RESOURCES.length, 10000, "The Work Boats to appear");
      scene().focusOnTile(settlerTile, 4);
    },
    verification: () => SEA_RESOURCES.every((resource) => resourceTile(resource)?.getTileTypes()[0] === "shallow_ocean")
  });

  runner.addStep({
    name: "Settle: the city is coastal and can build a Work Boat",
    action: async () => {
      const settler = await utils.findUnitWithAction("settle");
      WebsocketClient.sendMessage({
        event: "unitAction",
        unitX: settler.getTile().getGridX(),
        unitY: settler.getTile().getGridY(),
        id: settler.getID(),
        actionName: "settle"
      });
      await utils.waitUntil(() => !!city(), 5000, "City to be founded");

      NetworkEvents.on({
        eventName: "updateProductionOptions",
        parentObject: runner,
        callback: (data: any) => (productionOptions = data["units"].map((unit: { name: string }) => unit.name))
      });
      WebsocketClient.sendMessage({ event: "requestProductionOptions", cityName: city().getName() });
      await utils.waitUntil(() => productionOptions.length > 0, 3000, "Production options to arrive");
    },
    verification: () => settlerTile.isCoastal() && productionOptions.includes("Work Boat")
  });

  runner.addStep({
    name: "Work Boats can't go ashore, and land units can't go to sea",
    action: async () => {
      const boat = workBoats().find((unit) => shoreBeside(unit.getTile()));
      if (!boat) throw new Error("No Work Boat beside open land");
      // The server gets the last word: this order should go nowhere.
      moveUnit(boat, shoreBeside(boat.getTile()));
      await utils.delay(1000);
    },
    verification: () => {
      const boat = workBoats().find((unit) => shoreBeside(unit.getTile()));
      const warrior = utils
        .getClientPlayer()
        .getUnits()
        .find((unit) => unit.getName() === "Warrior");
      const water = warrior
        .getTile()
        .getAdjacentTiles()
        .find((tile) => tile?.isWater());
      return (
        !!boat &&
        boat.getTile().isWater() &&
        !hasPath(boat, shoreBeside(boat.getTile())) &&
        !!water &&
        !hasPath(warrior, water)
      );
    }
  });

  for (const resource of SEA_RESOURCES) {
    let target: Tile | undefined;
    let foodBefore = 0;

    runner.addStep({
      name: `Sail a Work Boat onto the ${resource} and build Fishing Boats: +1 food, boat used up`,
      action: async () => {
        target = resourceTile(resource);
        foodBefore = target.getTileYield()?.food ?? 0;
        const boat = workBoats().find((unit) => unit.getTile().getAdjacentTiles().includes(target));
        if (!boat) throw new Error(`No Work Boat beside the ${resource}`);

        moveUnit(boat, target);
        await utils.waitUntil(() => boat.getTile() === target, 3000, `Work Boat to reach the ${resource}`);
        await pressAction(boat, "build_fishing_boats");
        await utils.waitUntil(
          () => target.getTileTypes().includes(`improved_${resource}`),
          3000,
          "Fishing Boats to go down"
        );
      },
      verification: () =>
        (target.getTileYield()?.food ?? 0) === foodBefore + 1 &&
        !target.getTileTypes().includes(resource) &&
        target.getUnits().length === 0
    });
  }

  runner.addStep({
    name: "The city's production list shows each ship's own sprite, and Walls' and Water Mill's, not a question mark",
    action: async () => {
      scene().toggleCityUI(city());
      await utils.waitUntil(() => !!cityScreen(), 3000, "City screen to open");
      cityScreen()["openChooseProduction"]();
      await utils.waitUntil(() => !!cityScreen()["chooseProductionListBox"], 3000, "Production list to show");
      // Long enough to see the list before it closes.
      await utils.delay(2000);
    },
    verification: () => {
      const icon = (type: string, name: string) => cityScreen()["resolveProductionIcon"]({ type, name, cost: 0 });
      const shown = [
        icon("unit", "Work Boat"),
        icon("unit", "Galley"),
        icon("unit", "Cargo Ship"),
        icon("building", "Walls"),
        icon("building", "Water Mill")
      ];
      scene().toggleCityUI();
      return (
        JSON.stringify(shown) ===
        JSON.stringify([
          SpriteRegion.UNIT_WORK_BOAT,
          SpriteRegion.UNIT_GALLEY,
          SpriteRegion.UNIT_CARGO_SHIP,
          SpriteRegion.BUILDING_WALLS,
          SpriteRegion.BUILDING_WATER_MILL
        ])
      );
    }
  });

  runner.addStep({
    name: "Build another Work Boat: it launches in the city or on the water beside it",
    action: async () => {
      WebsocketClient.sendMessage({
        event: "addToProductionQueue",
        cityName: city().getName(),
        type: "unit",
        name: "Work Boat"
      });
      for (let turn = 0; turn < 40 && workBoats().length === 0; turn++) {
        WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
        await utils.delay(400);
      }
      NetworkEvents.removeCallbacksByParentObject(runner);
    },
    verification: () => {
      const boat = workBoats()[0];
      return (
        !!boat &&
        (boat.getTile() === settlerTile ||
          (boat.getTile().isWater() && settlerTile.getAdjacentTiles().includes(boat.getTile())))
      );
    }
  });

  return runner;
}
