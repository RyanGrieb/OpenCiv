import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { Tile } from "../../map/Tile";
import { GameMap } from "../../map/GameMap";
import { TestUtils } from "../TestUtils";

// Starts on the ancient_ruins map preset (server/config/map_presets.yml): ruins beside the Settler and
// another a couple of tiles away. Walks the Settler, then the Warrior, onto them and checks each ruin
// disappears, pays 75 gold and posts a notification. Also checks the random ruins the server scattered
// over the rest of the map keep away from the start.
export function setupAncientRuinsTest(game: Game) {
  const runner = new TestRunner("AncientRuins");
  const utils = new TestUtils(game);
  const RUINS = "ancient_ruins";
  const GOLD_REWARD = 75;
  let settlerTile: Tile | undefined;
  let presetRuins: Tile[] = [];
  let goldBefore = 0;

  const hasRuins = (tile: Tile) => tile.getTileTypes().includes(RUINS);
  const allRuins = () =>
    GameMap.getInstance()
      .getTiles()
      .flat()
      .filter((tile) => tile && hasRuins(tile));
  const gold = () => utils.getClientPlayer().getAccumulatedStat("gold");
  const unitNamed = (name: string) =>
    utils
      .getClientPlayer()
      .getUnits()
      .find((unit) => unit.getName() === name);
  const ruinsMessages = () =>
    utils
      .getInGameScene()
      .getNotifications()
      .getAll()
      .filter((notification) => notification.text.includes("explored ancient ruins"));
  const endTurn = async () => {
    WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
    await utils.delay(600);
  };

  const exploreWith = async (unit: Unit, ruin: Tile) => {
    goldBefore = gold();
    utils.log(`${unit.getName()} heads for the ruins at (${ruin.getGridX()}, ${ruin.getGridY()})`, "yellow");
    await utils.walkTo(unit, () => [ruin], WebsocketClient.sendMessage.bind(WebsocketClient), endTurn);
    await utils.waitUntil(() => !hasRuins(ruin), 3000, "The ruins to disappear");
    await utils.waitUntil(() => gold() >= goldBefore + GOLD_REWARD, 3000, "The gold to arrive");
    utils.log(`Gold: ${goldBefore} -> ${gold()}`, "yellow");
  };

  runner.addStep({
    name: "Start on the ancient_ruins map: ruins beside the Settler",
    action: async () => {
      WebsocketClient.init("localhost");
      await utils.waitUntil(() => game.getCurrentScene().getName() === "lobby", 5000, "Scene to become lobby");

      WebsocketClient.sendMessage({ event: "setGameOption", option: "mapPreset", value: "ancient_ruins" });
      WebsocketClient.sendMessage({ event: "setGameOption", option: "revealMap", value: true });
      WebsocketClient.sendMessage({ event: "setGameOption", option: "allowBarbarians", value: false });
      WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
      await utils.waitUntil(() => game.getCurrentScene().getName() === "in_game", 15000, "Scene to become in_game");

      const settler = await utils.findUnitWithAction("settle");
      settlerTile = settler.getTile();
      await utils.waitUntil(() => allRuins().length > 0, 10000, "Ruins to show on the map");

      presetRuins = allRuins()
        .filter((tile) => Tile.gridDistance(tile, settlerTile) <= 3)
        .sort((a, b) => Tile.gridDistance(a, settlerTile) - Tile.gridDistance(b, settlerTile));
      utils.getInGameScene().focusOnTile(settlerTile, 4);
      await utils.delay(1000);
    },
    verification: () => presetRuins.length === 2 && settlerTile.getAdjacentTiles().includes(presetRuins[0])
  });

  runner.addStep({
    name: "More ruins are scattered over the map, none near the start",
    action: async () => {
      const scattered = allRuins().filter((tile) => !presetRuins.includes(tile));
      utils.log(`${scattered.length} other ruins on the map`, "yellow");
    },
    verification: () => {
      const scattered = allRuins().filter((tile) => !presetRuins.includes(tile));
      return scattered.length > 0 && scattered.every((tile) => Tile.gridDistance(tile, settlerTile) >= 3);
    }
  });

  runner.addStep({
    name: "The Settler walks into the ruins beside it: they vanish and pay 75 gold",
    action: async () => {
      await exploreWith(unitNamed("Settler"), presetRuins[0]);
    },
    verification: () => !hasRuins(presetRuins[0]) && gold() === goldBefore + GOLD_REWARD
  });

  runner.addStep({
    name: "A notification says what the ruins gave",
    action: async () => {
      await utils.waitUntil(() => ruinsMessages().length > 0, 3000, "The ruins notification");
      utils.log(ruinsMessages()[0].text, "yellow");
    },
    verification: () => ruinsMessages().some((notification) => notification.text.includes(`${GOLD_REWARD} gold`))
  });

  runner.addStep({
    name: "The Warrior explores the second ruins for another 75 gold",
    action: async () => {
      await exploreWith(unitNamed("Warrior"), presetRuins[1]);
      utils.getInGameScene().focusOnTile(presetRuins[1], 4);
    },
    verification: () => !hasRuins(presetRuins[1]) && gold() === goldBefore + GOLD_REWARD
  });

  return runner;
}
