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
// from its coordinates. With every tech costing 1 science, settles a city and researches into the
// Classical and then the Medieval Era, checking the city is redrawn each time. Stays zoomed in on the
// city so each change can be seen by eye.
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
      await utils.ensureInGame({ allowBarbarians: false, startWithAllTechs: false, techCostPercent: 1 });
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
      ["ancient", "classical", "medieval"].every((era) =>
        [1, 2, 3].every((variant) => inAtlas(`city_${era}_${variant}`))
      )
  });

  runner.addStep({
    name: "Mathematics brings the Classical Era, and the city is rebuilt in its style",
    action: async () => researchInOrder(["Animal Husbandry", "Archery", "The Wheel", "Mathematics"]),
    verification: () => city.getEra() === "classical" && drawnAs().startsWith("city_classical_")
  });

  runner.addStep({
    name: "Guilds brings the Medieval Era, and the city is rebuilt again",
    action: async () => researchInOrder(["Currency", "Guilds"]),
    verification: () => city.getEra() === "medieval" && drawnAs().startsWith("city_medieval_")
  });

  return runner;
}
