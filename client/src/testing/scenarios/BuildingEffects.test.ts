import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { City } from "../../city/City";
import { Tile } from "../../map/Tile";
import { ChooseProductionList } from "../../ui/windows/city/ChooseProductionList";
import { Label } from "../../ui/components/Label";
import { TestUtils } from "../TestUtils";

// The techs the buildings below need, in an order that meets every prerequisite.
const TECHS = [
  "Pottery",
  "Sailing",
  "Optics",
  "Writing",
  "Mining",
  "Masonry",
  "Animal Husbandry",
  "Archery",
  "The Wheel",
  "Mathematics",
  "Currency"
];
// Left unresearched, to take as the Great Library's free tech.
const FREE_TECH = "Drama and Poetry";

// Civ 5's building and wonder effects against a live server, on the building_effects map preset
// (server/config/map_presets.yml): a coastal city with Desert and Jungle beside it and a Work Boat.
// Techs and production cost 1% (the techCostPercent and productionCostPercent game options), so each
// tech takes a turn and anything queued is finished the next turn. Checks tile bonuses, a percentage,
// free units, faster ships, a free tech and the tooltips, and ends with the Mausoleum's tooltip showing
// an effect that isn't in the game yet.
export function setupBuildingEffectsTest(game: Game) {
  const runner = new TestRunner("BuildingEffects");
  const utils = new TestUtils(game);
  let city: City | undefined;
  // Values from before a step, to compare with after.
  let before: Record<string, number> = {};
  let greatLighthouseTooltip: string[] = [];

  const me = () => utils.getClientPlayer();
  const scene = () => utils.getInGameScene() as unknown as Record<string, any>;
  const cityScreen = () => scene()["cityDisplayInfo"] as Record<string, any> | undefined;
  const openList = (): ChooseProductionList | undefined => cityScreen()?.["chooseProductionList"];
  const hasBuilding = (name: string) => city.getBuildings().some((building) => building.getName() === name);
  const adjacentOfType = (type: string): Tile =>
    city
      .getTile()
      .getAdjacentTiles()
      .find((tile) => tile?.getTileTypes().includes(type));
  // Tile yields arrive with the redrawn map chunk, which can take a while on a slow machine.
  const yieldOf = (tile: Tile, stat: string) => tile.getTileYield()?.[stat] ?? 0;
  const builders = () => (me()?.getUnits() ?? []).filter((unit) => unit.getName() === "Builder");
  const workBoat = () => (me()?.getUnits() ?? []).find((unit) => unit.getName() === "Work Boat");

  const endTurn = async () => {
    WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
    await utils.delay(600);
  };
  const buildNow = async (name: string) => {
    WebsocketClient.sendMessage({ event: "addToProductionQueue", cityName: city.getName(), type: "building", name });
    await utils.waitUntil(
      () => city.getProductionQueue().some((item) => item.name === name),
      5000,
      `${name} to be queued`
    );
    WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
    await utils.waitUntil(() => hasBuilding(name), 5000, `${name} to be built`);
    await utils.delay(300);
  };

  const tooltipLines = (): string[] => {
    const tooltip = (openList() as unknown as Record<string, any>)?.["tooltip"];
    return tooltip
      ? tooltip
          .getActors()
          .filter((actor: object) => actor instanceof Label)
          .map((label: Label) => label.getText())
      : [];
  };
  // Opens the city's production list, scrolls it to the row for `name`, and opens its tooltip as hovering it would.
  const hoverListRow = async (name: string) => {
    if (cityScreen()) utils.getInGameScene().toggleCityUI(city);
    utils.getInGameScene().toggleCityUI(city);
    await utils.waitUntil(() => !!cityScreen(), 5000, "City screen to open");
    cityScreen()["toggleList"]("produce");
    await utils.waitUntil(
      () => (openList() as unknown as Record<string, any>)?.["rows"]?.length > 0,
      5000,
      "Production list to appear"
    );

    const list = openList() as unknown as Record<string, any>;
    const rowName = (row: any) =>
      row
        .getLabel()
        .getText()
        .replace(/\s*\(\d+ turns?\)$/, "");
    const findRow = () => (list["rows"] as any[]).find((row) => rowName(row) === name);
    list["setScrollOffset"](list["scrollOffset"] + findRow().getY() - list["y"] - 100);
    await utils.delay(200);
    // Not with a made-up mouse event: on a scaled display its position can miss the row.
    openList().showTooltipFor(name);
    await utils.waitUntil(() => tooltipLines()[0] === name, 5000, `${name}'s tooltip to appear`);
    utils.log(JSON.stringify(tooltipLines()), "yellow");
  };

  runner.addStep({
    name: "Start on the building_effects map with 1% tech and production costs, and settle beside the sea",
    action: async () => {
      await utils.ensureInGame({
        allowBarbarians: false,
        numCityStates: 0,
        revealMap: true,
        mapPreset: "building_effects",
        techCostPercent: 1,
        productionCostPercent: 1
      });
      // Drawing the revealed map takes a while, and units only arrive once it's done.
      await utils.waitUntil(() => !!workBoat(), 90000, "The Work Boat to appear");
      const settler = await utils.findUnitWithAction("settle");
      utils.getInGameScene().focusOnTile(settler.getTile(), 4);
      WebsocketClient.sendMessage({
        event: "unitAction",
        unitX: settler.getTile().getGridX(),
        unitY: settler.getTile().getGridY(),
        id: settler.getID(),
        actionName: "settle"
      });
      await utils.waitUntil(() => me().getCities().length > 0, 5000, "City to be founded");
      city = me().getCities()[0];
      await utils.waitUntil(() => city.hasStats(), 5000, "City stats to arrive");
    },
    verification: () => !!adjacentOfType("desert") && !!adjacentOfType("shallow_ocean") && !!workBoat()
  });

  runner.addStep({
    name: `Research ${TECHS.join(", ")}, a turn each`,
    action: async () => {
      for (const tech of TECHS) {
        WebsocketClient.sendMessage({ event: "chooseResearch", techName: tech });
        await endTurn();
        await utils.waitUntil(() => me().hasResearchedTech(tech), 5000, `${tech} to be researched`);
      }
    },
    verification: () => TECHS.every((tech) => me().hasResearchedTech(tech))
  });

  runner.addStep({
    name: "A Lighthouse adds +1 Food to the city's sea tiles",
    action: async () => {
      before = { seaFood: yieldOf(adjacentOfType("shallow_ocean"), "food") };
      await buildNow("Lighthouse");
      await utils.waitUntil(
        () => yieldOf(adjacentOfType("shallow_ocean"), "food") === before.seaFood + 1,
        60000,
        "Sea tile food to rise"
      );
    },
    verification: () => yieldOf(adjacentOfType("shallow_ocean"), "food") === before.seaFood + 1
  });

  runner.addStep({
    name: "Petra adds +1 Food and +1 Production to the city's Desert",
    action: async () => {
      const desert = adjacentOfType("desert");
      before = { food: yieldOf(desert, "food"), production: yieldOf(desert, "production") };
      await buildNow("Petra");
      await utils.waitUntil(
        () => yieldOf(adjacentOfType("desert"), "production") === before.production + 1,
        60000,
        "Desert yields to rise"
      );
    },
    verification: () =>
      yieldOf(adjacentOfType("desert"), "food") === before.food + 1 &&
      yieldOf(adjacentOfType("desert"), "production") === before.production + 1
  });

  runner.addStep({
    name: "A Market gives +1 Gold, then +25% of the city's Gold, rounded down",
    action: async () => {
      before = { gold: city.getStat("gold") };
      await buildNow("Market");
      await utils.waitUntil(() => city.getStat("gold") !== before.gold, 5000, "City gold to change");
      utils.log(`Gold ${before.gold} -> ${city.getStat("gold")}`, "yellow");
    },
    verification: () => city.getStat("gold") === Math.floor(((before.gold + 1) * 125) / 100)
  });

  runner.addStep({
    name: "The Great Pyramids bring two free Builders",
    action: async () => {
      before = { builders: builders().length };
      await buildNow("Great Pyramids");
      await utils.waitUntil(() => builders().length === before.builders + 2, 5000, "Two Builders to appear");
    },
    verification: () => builders().length === before.builders + 2
  });

  runner.addStep({
    name: "The Great Lighthouse's tooltip lists its effects, and building it gives the Work Boat +1 Movement",
    action: async () => {
      await hoverListRow("Great Lighthouse");
      greatLighthouseTooltip = tooltipLines();
      before = { movement: workBoat().getDefaultMoveDistance() };
      await buildNow("Great Lighthouse");
      await utils.waitUntil(
        () => workBoat().getDefaultMoveDistance() === before.movement + 1,
        5000,
        "Work Boat movement to rise"
      );
    },
    verification: () =>
      greatLighthouseTooltip.includes("+1 Movement for ships") &&
      greatLighthouseTooltip.includes("+1 Sight for ships") &&
      workBoat().getDefaultMoveDistance() === before.movement + 1
  });

  runner.addStep({
    name: `The Great Library gives a free tech: ${FREE_TECH} is researched the moment it's chosen`,
    action: async () => {
      await buildNow("Great Library");
      WebsocketClient.sendMessage({ event: "chooseResearch", techName: FREE_TECH });
      await utils.waitUntil(() => me().hasResearchedTech(FREE_TECH), 3000, `${FREE_TECH} to be researched`);
    },
    verification: () => me().hasResearchedTech(FREE_TECH)
  });

  runner.addStep({
    name: "Leave the Mausoleum's tooltip showing: its real effect needs great people, so it's listed as not in the game yet",
    action: async () => hoverListRow("Mausoleum of Halicarnassus"),
    verification: () =>
      tooltipLines().includes("Not in the game yet:") &&
      tooltipLines().includes("+100 Gold whenever a Great Person is expended")
  });

  return runner;
}
