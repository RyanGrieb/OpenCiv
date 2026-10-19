import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { City } from "../../city/City";
import { TestUtils } from "../TestUtils";

// Writing's prerequisite and Writing itself, for the Great Library.
const TECHS = ["Pottery", "Writing"];
// Chosen as research before the free tech is picked: it must stay in progress, not be taken for free.
const RESEARCH = "Mining";
const DETAIL_TECH = "Sailing";

// The Great Library's free tech, picked by the player: builds the Great Library at 1% production cost,
// with research already going on Mining. The turn button reads Pick Free Tech and opens a list of the
// techs that could be researched now, down the left like the pantheon list. Ends with Sailing's
// detail window open beside it: click Pick Free Tech to take it, or another tech in the list.
export function setupFreeTechPickerTest(game: Game) {
  const runner = new TestRunner("FreeTechPicker");
  const utils = new TestUtils(game);
  let city: City | undefined;

  const me = () => utils.getClientPlayer();
  const scene = () => utils.getInGameScene();
  const list = () => scene().getFreeTechList();
  const nextTurnText = () => scene().getNextTurnButton().getText();
  const hasGreatLibrary = () => city.getBuildings().some((building) => building.getName() === "Great Library");

  const endTurn = async () => {
    WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
    await utils.delay(600);
  };

  runner.addStep({
    name: "Start with 1% production costs and settle a city",
    action: async () => {
      await utils.ensureInGame({
        allowBarbarians: false,
        numCityStates: 0,
        revealMap: true,
        mapPreset: "pantheons",
        techCostPercent: 0,
        productionCostPercent: 1
      });
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
      scene().focusOnTile(city.getTile(), 3);
      await utils.waitUntil(() => city.hasStats(), 5000, "City stats to arrive");
    },
    verification: () => !!city
  });

  runner.addStep({
    name: `Research ${TECHS.join(" and ")}, a turn each`,
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
    name: `Build the Great Library, then research ${RESEARCH}: the turn button reads Pick Free Tech and ${RESEARCH} stays in progress`,
    action: async () => {
      WebsocketClient.sendMessage({
        event: "addToProductionQueue",
        cityName: city.getName(),
        type: "building",
        name: "Great Library"
      });
      await utils.waitUntil(
        () => city.getProductionQueue().some((item) => item.name === "Great Library"),
        5000,
        "The Great Library to be queued"
      );
      await endTurn();
      await utils.waitUntil(() => hasGreatLibrary(), 5000, "The Great Library to be built");
      WebsocketClient.sendMessage({ event: "chooseResearch", techName: RESEARCH });
      await utils.skipIdleUnits();
      await utils.waitUntil(() => nextTurnText() === "Pick Free Tech", 5000, "The turn button to read Pick Free Tech");
      await utils.delay(500);
    },
    verification: () =>
      nextTurnText() === "Pick Free Tech" &&
      me().getCurrentResearch()?.techName === RESEARCH &&
      !me().hasResearchedTech(RESEARCH)
  });

  runner.addStep({
    name: "Click Pick Free Tech: the list opens with only techs that could be researched now",
    action: async () => {
      scene().getNextTurnButton().call("clicked");
      await utils.waitUntil(() => list()?.getTechNames().length > 0, 5000, "The free tech list to fill");
    },
    verification: () => {
      const names = list()?.getTechNames() ?? [];
      return (
        names.includes(RESEARCH) &&
        names.includes(DETAIL_TECH) &&
        names.every((name) => !me().hasResearchedTech(name)) &&
        !names.includes("Philosophy")
      );
    }
  });

  runner.addStep({
    name: `Click ${DETAIL_TECH}: its tech window opens beside the list, Free, with a Pick Free Tech button`,
    action: async () => {
      list().openTechDetail(DETAIL_TECH);
      await utils.waitUntil(() => !!list()?.getDetailWindow()?.isBuilt(), 5000, "The tech window to open");
    },
    verification: () => {
      const detail = list()?.getDetailWindow();
      return detail?.getTexts().includes("Free") && detail.getActionButton()?.getText() === "Pick Free Tech";
    }
  });

  return runner;
}
