import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { City } from "../../city/City";
import { Tile } from "../../map/Tile";
import { TestUtils } from "../TestUtils";

// Middle-clicking a tile opens a tooltip listing what it yields and where each yield comes from.
// Runs on the trapping map preset (a Deer in a tundra forest, Bison on plains) with every tech, settles
// a city, then opens the tooltip on the Deer, the Bison and the city center, the way a middle click does.
// The last tooltip stays open; middle-click any other tile to see its breakdown.
export function setupTileTooltipTest(game: Game) {
  const runner = new TestRunner("TileTooltip");
  const utils = new TestUtils(game);
  let city: City | undefined;
  const tiles: Record<string, Tile> = {};

  const me = () => utils.getClientPlayer();
  const inspector = () => utils.getInGameScene().getTileInspector();
  const sourceNames = () => (inspector().getInfo()?.sources ?? []).map((entry) => entry.source);

  const inspect = async (tile: Tile) => {
    utils.getInGameScene().focusOnTile(tile, 4);
    inspector().inspect(tile, Game.getInstance().getWidth() / 2, Game.getInstance().getHeight() / 2);
    await utils.waitUntil(() => !!inspector().getTooltip(), 5000, "The tile tooltip to open");
  };

  runner.addStep({
    name: "Start on the trapping map with every tech, and settle a city around the Deer and Bison",
    action: async () => {
      await utils.ensureInGame({
        allowBarbarians: false,
        revealMap: true,
        startWithAllTechs: true,
        mapPreset: "trapping"
      });
      const builders = () => (me()?.getUnits() ?? []).filter((unit) => unit.getName() === "Builder");
      await utils.waitUntil(() => builders().length > 0, 90000, "The Builders to appear");
      for (const builder of builders()) {
        const resource = ["deer", "bison"].find((name) => builder.getTile().getTileTypes().includes(name));
        if (resource) tiles[resource] = builder.getTile();
      }

      const settler = await utils.findUnitWithAction("settle");
      WebsocketClient.sendMessage({
        event: "unitAction",
        unitX: settler.getTile().getGridX(),
        unitY: settler.getTile().getGridY(),
        id: settler.getID(),
        actionName: "settle"
      });
      await utils.waitUntil(() => me().getCities().length > 0, 5000, "City to be founded");
      city = me().getCities()[0];
    },
    verification: () => !!tiles.deer && !!tiles.bison && !!city
  });

  runner.addStep({
    name: "Middle-click the Deer: Forest and Deer each list their yields, and the city's name shows",
    action: async () => inspect(tiles.deer),
    verification: () =>
      sourceNames().includes("Forest") &&
      sourceNames().includes("Deer") &&
      inspector().getInfo()?.cityName === city.getName()
  });

  runner.addStep({
    name: "Close it and middle-click the Bison: Plains and Bison",
    action: async () => {
      inspector().close();
      await inspect(tiles.bison);
    },
    verification: () => sourceNames().includes("Plains") && sourceNames().includes("Bison")
  });

  runner.addStep({
    name: "Middle-click the city center: it's worked, and its yields add up to the total",
    action: async () => {
      inspector().close();
      await inspect(city.getTile());
    },
    verification: () => {
      const info = inspector().getInfo();
      const sum = (stats: Record<string, number>[], stat: string) =>
        stats.reduce((total, entry) => total + (entry[stat] ?? 0), 0);
      const sourceFood = sum(info?.sources.flatMap((source) => source.stats) ?? [], "food");
      return !!info?.worked && sourceFood === sum(info.yields, "food") && sourceFood >= 2;
    }
  });

  return runner;
}
