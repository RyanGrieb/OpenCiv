import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { resolveSpriteRegion } from "../../Assets";
import { SpriteAtlas } from "../../SpriteAtlas";
import { WebsocketClient } from "../../network/Client";
import { City } from "../../city/City";
import { Tile } from "../../map/Tile";
import { InGameScene } from "../../scene/type/InGameScene";
import { TestUtils } from "../TestUtils";

// A city is drawn with walls all the way round it only once it builds them, and the walls look
// different for each defensive building: a plain stone ring for Walls, taller towers for a Castle.
// Starts with every tech and 1% production costs, settles a city, then builds Walls and a Castle,
// staying zoomed in on the city so each change can be seen by eye.
export function setupCityWallsTest(game: Game) {
  const runner = new TestRunner("CityWalls");
  const utils = new TestUtils(game);
  let city: City | undefined;

  const scene = () => game.getCurrentSceneAs<InGameScene>();
  const drawnAs = () =>
    Tile.getCityTypes(city.getEra(), city.getWalls(), city.getTile().getGridX(), city.getTile().getGridY());
  const inAtlas = (tileType: string) =>
    !!SpriteAtlas.getInstance().getRegion(resolveSpriteRegion(`TILE_${tileType.toUpperCase()}`));
  const hasBuilding = (name: string) => city.getBuildings().some((building) => building.getName() === name);

  const build = async (name: string) => {
    WebsocketClient.sendMessage({ event: "addToProductionQueue", cityName: city.getName(), type: "building", name });
    await utils.waitUntil(() => city.getProductionQueue().some((item) => item.name === name), 5000, `${name} to be queued`);
    WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
    await utils.waitUntil(() => hasBuilding(name), 5000, `${name} to be built`);
    // The new look arrives right behind the building.
    await utils.delay(1000);
    utils.log(`The city is drawn as ${drawnAs().join(", ")}`, "yellow");
  };

  runner.addStep({
    name: "Start with every tech and 1% production costs, and settle a city: no walls yet",
    action: async () => {
      await utils.ensureInGame({ allowBarbarians: false, startWithAllTechs: true, productionCostPercent: 1 });
      const settler = await utils.findUnitWithAction("settle");
      const tile = settler.getTile();
      WebsocketClient.sendMessage({
        event: "unitAction",
        unitX: tile.getGridX(),
        unitY: tile.getGridY(),
        id: settler.getID(),
        actionName: "settle"
      });
      await utils.waitUntil(() => utils.getClientPlayer().getCities().length > 0, 5000, "City to be founded");
      city = utils.getClientPlayer().getCities()[0];
      await utils.waitUntil(() => city.hasStats(), 5000, "City stats to arrive");
      scene().focusOnTile(tile, 6);
      await utils.delay(1000);
      utils.log(`The city is drawn as ${drawnAs().join(", ")}`, "yellow");
    },
    verification: () => city?.getWalls() === null && drawnAs().length === 1
  });

  runner.addStep({
    name: "Both kinds of walls have their two halves in the sprite atlas",
    action: async () => {},
    verification: () =>
      ["walls", "castle"].every((kind) => inAtlas(`city_${kind}_back`) && inAtlas(`city_${kind}_front`))
  });

  runner.addStep({
    name: "Building Walls rings the city with stone walls",
    action: async () => build("Walls"),
    verification: () =>
      city.getWalls() === "walls" && drawnAs()[0] === "city_walls_back" && drawnAs()[2] === "city_walls_front"
  });

  runner.addStep({
    name: "Building a Castle swaps them for its towered walls",
    action: async () => build("Castle"),
    verification: () =>
      city.getWalls() === "castle" && drawnAs()[0] === "city_castle_back" && drawnAs()[2] === "city_castle_front"
  });

  return runner;
}
