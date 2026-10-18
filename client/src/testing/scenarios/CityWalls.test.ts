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
// different for each defensive building: a plain stone ring for Walls, taller towers for a Castle, an
// earth rampart with gun bastions for an Arsenal, and a concrete wall with barbed wire and watchtowers
// for a Military Base. Each one also adds to the city's HP and strength (Walls +50 HP +5, Castle +25 +7,
// Arsenal +25 +9, Military Base +25 +12). Starts with every tech and 1% production costs, settles a
// city, then builds all four in order, staying zoomed in on the city so each change can be seen by eye.
export function setupCityWallsTest(game: Game) {
  const runner = new TestRunner("CityWalls");
  const utils = new TestUtils(game);
  let city: City | undefined;

  const scene = () => game.getCurrentSceneAs<InGameScene>();
  const drawnAs = () =>
    Tile.getCityTypes(city.getEra(), city.getWalls(), city.getTile().getGridX(), city.getTile().getGridY());
  const inAtlas = (tileType: string) =>
    !!SpriteAtlas.getInstance().getRegion(resolveSpriteRegion(`TILE_${tileType.toUpperCase()}`));
  const drawnWith = (walls: string) =>
    city.getWalls() === walls && drawnAs()[0] === `city_${walls}_back` && drawnAs()[2] === `city_${walls}_front`;
  const hasBuilding = (name: string) => city.getBuildings().some((building) => building.getName() === name);

  const build = async (name: string) => {
    WebsocketClient.sendMessage({ event: "addToProductionQueue", cityName: city.getName(), type: "building", name });
    await utils.waitUntil(
      () => city.getProductionQueue().some((item) => item.name === name),
      5000,
      `${name} to be queued`
    );
    // Even at 1% costs a city with little production can need a few turns for the dearer buildings.
    for (let turn = 0; turn < 5 && !hasBuilding(name); turn++) {
      WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
      await utils.waitUntil(() => hasBuilding(name), 3000).catch(() => {});
    }
    await utils.waitUntil(() => hasBuilding(name), 1000, `${name} to be built`);
    // The new look arrives right behind the building.
    await utils.delay(1000);
    utils.log(`The city is drawn as ${drawnAs().join(", ")}`, "yellow");
    utils.log(`The city has ${city.getMaxHealth()} HP and ${city.getStrength()} strength`, "yellow");
  };
  // Whether a building added this much to the city's max HP and strength. Strength is checked loosely: a
  // city on a hill gets 25% more of it, and growing a pop between turns adds 0.4.
  let before = { health: 0, strength: 0 };
  const remember = () => (before = { health: city.getMaxHealth(), strength: city.getStrength() });
  const gained = (health: number, strength: number) => {
    const strengthGain = city.getStrength() - before.strength;
    return (
      city.getMaxHealth() - before.health === health &&
      strengthGain > strength - 0.5 &&
      strengthGain < strength * 1.25 + 1
    );
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
    name: "All four kinds of walls have their two halves in the sprite atlas",
    action: async () => {},
    verification: () =>
      ["walls", "castle", "arsenal", "military_base"].every(
        (kind) => inAtlas(`city_${kind}_back`) && inAtlas(`city_${kind}_front`)
      )
  });

  runner.addStep({
    name: "Building Walls rings the city with stone walls",
    action: async () => {
      remember();
      await build("Walls");
    },
    verification: () => drawnWith("walls") && gained(50, 5)
  });

  runner.addStep({
    name: "Building a Castle swaps them for its towered walls",
    action: async () => {
      remember();
      await build("Castle");
    },
    verification: () => drawnWith("castle") && gained(25, 7)
  });

  runner.addStep({
    name: "Building an Arsenal swaps them for an earth rampart with gun bastions",
    action: async () => {
      remember();
      await build("Arsenal");
    },
    verification: () => drawnWith("arsenal") && gained(25, 9)
  });

  runner.addStep({
    name: "Building a Military Base swaps them for a concrete wall with barbed wire and watchtowers",
    action: async () => {
      remember();
      await build("Military Base");
    },
    verification: () => drawnWith("military_base") && gained(25, 12)
  });

  return runner;
}
