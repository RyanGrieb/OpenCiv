import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { resolveSpriteRegion } from "../../Assets";
import { SpriteAtlas } from "../../SpriteAtlas";
import { WebsocketClient } from "../../network/Client";
import { City } from "../../city/City";
import { Tile } from "../../map/Tile";
import { InGameScene } from "../../scene/type/InGameScene";
import { TestUtils } from "../TestUtils";

// A city is drawn in its owner's era, as the server reports it, in one of three looks per era picked
// from its coordinates. With every tech costing 1 science, settles a city and researches one era after
// another up to the Information Era, by the shortest path into each, checking the city is redrawn each
// time. Stays zoomed in on the city so each change can be seen by eye.
export function setupCityErasTest(game: Game) {
  const runner = new TestRunner("CityEras");
  const utils = new TestUtils(game);
  let city: City | undefined;

  const scene = () => game.getCurrentSceneAs<InGameScene>();
  const drawnAs = () => Tile.getCityType(city.getEra(), city.getTile().getGridX(), city.getTile().getGridY());
  const inAtlas = (tileType: string) =>
    !!SpriteAtlas.getInstance().getRegion(resolveSpriteRegion(`TILE_${tileType.toUpperCase()}`));

  const researchInOrder = async (techs: string[]) => {
    for (const tech of techs) {
      WebsocketClient.sendMessage({ event: "chooseResearch", techName: tech });
      WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
      await utils.waitUntil(() => utils.getClientPlayer().hasResearchedTech(tech), 5000, `${tech} to be researched`);
    }
    // The era change arrives right behind the research update.
    await utils.delay(1000);
    utils.log(`The city is drawn as ${drawnAs()}`, "yellow");
  };

  runner.addStep({
    name: "Start a game with 1-science techs and settle a city",
    action: async () => {
      await utils.ensureInGame({ allowBarbarians: false, startWithAllTechs: false, techCostPercent: 0 });
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
      scene().focusOnTile(tile, 6);
      await utils.delay(1000);
      utils.log(`The city is drawn as ${drawnAs()}`, "yellow");
    },
    verification: () => city?.getEra() === "ancient" && inAtlas(drawnAs())
  });

  runner.addStep({
    name: "Every era's three looks are in the sprite atlas",
    action: async () => {},
    verification: () =>
      ["ancient", "classical", "medieval", "renaissance", "industrial", "modern", "atomic", "information"].every(
        (era) => [1, 2, 3].every((variant) => inAtlas(`city_${era}_${variant}`))
      )
  });

  // Each era's techs, in research order: the fewest techs, on top of the earlier eras', that reach it.
  const eraPaths: [string, string, string[]][] = [
    ["classical", "Mathematics", ["Animal Husbandry", "Archery", "The Wheel", "Mathematics"]],
    ["medieval", "Guilds", ["Currency", "Guilds"]],
    [
      "renaissance",
      "Printing Press",
      [
        "Mining",
        "Masonry",
        "Construction",
        "Engineering",
        "Machinery",
        "Bronze Working",
        "Iron Working",
        "Metal Casting",
        "Physics",
        "Printing Press"
      ]
    ],
    ["industrial", "Rifling", ["Steel", "Gunpowder", "Metallurgy", "Rifling"]],
    [
      "modern",
      "Radio",
      [
        "Pottery",
        "Writing",
        "Drama and Poetry",
        "Calendar",
        "Philosophy",
        "Theology",
        "Trapping",
        "Horseback Riding",
        "Civil Service",
        "Education",
        "Chivalry",
        "Banking",
        "Economics",
        "Acoustics",
        "Architecture",
        "Scientific Theory",
        "Electricity",
        "Radio"
      ]
    ],
    [
      "atomic",
      "Atomic Theory",
      ["Industrialization", "Steam Power", "Replaceable Parts", "Flight", "Electronics", "Plastics", "Atomic Theory"]
    ],
    ["information", "Satellites", ["Ballistics", "Radar", "Rocketry", "Satellites"]]
  ];

  for (const [era, firstTech, path] of eraPaths) {
    const eraName = era.charAt(0).toUpperCase() + era.slice(1);
    runner.addStep({
      name: `${firstTech} brings the ${eraName} Era, and the city is rebuilt in its style`,
      action: async () => researchInOrder(path),
      verification: () => city.getEra() === era && drawnAs().startsWith(`city_${era}_`)
    });
  }

  return runner;
}
