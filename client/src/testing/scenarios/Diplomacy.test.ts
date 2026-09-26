import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { City } from "../../city/City";
import { Tile } from "../../map/Tile";
import { GameMap } from "../../map/GameMap";
import { InGameScene } from "../../scene/type/InGameScene";
import { NotificationData } from "../../notification/Notifications";
import { Relation } from "../../player/Diplomacy";
import { TestUtils } from "../TestUtils";

// Plays Civ 5 war and peace out against a live server, from Player1's side. A second player joins
// over a bare websocket and only does what a step tells it to. The two civilizations start two tiles
// apart and at peace: they meet, their borders close to each other, we declare war and fight, and
// ten turns later they offer peace, which we accept.
export function setupDiplomacyTest(game: Game) {
  const runner = new TestRunner("Diplomacy");
  const utils = new TestUtils(game);
  let enemySocket: WebSocket | undefined;
  const enemyNotifications: string[] = [];
  let warrior: Unit | undefined;
  let enemyWarrior: Unit | undefined;
  let enemyCity: City | undefined;
  let enemyHealthBefore = 0;

  const scene = () => game.getCurrentSceneAs<InGameScene>();
  const me = () => utils.getClientPlayer();
  const allUnits = () => {
    const units: Unit[] = [];
    for (const column of GameMap.getInstance().getTiles()) {
      for (const tile of column ?? []) units.push(...(tile?.getUnits() ?? []));
    }
    return units;
  };
  const relation = (): Relation | undefined => me().getRelations()[0];
  const notifications = (): NotificationData[] => scene().getNotifications().getAll();
  const clientPlayer = () => me() as unknown as Record<string, any>;
  const watch = (tile: Tile) => scene().focusOnTile(tile, 3);
  const window = () => scene().getDiplomacyWindow();
  const rowButtons = () => window()?.getRowButtons(relation().name) ?? [];
  const enemyTerritory = () =>
    GameMap.getInstance()
      .getTiles()
      .flat()
      .filter((tile) => tile?.getTerritoryCity() === enemyCity);
  const ourUnitsInEnemyLand = () =>
    me()
      .getUnits()
      .filter((unit) => unit.getTile().getTerritoryCity() === enemyCity);

  const sendAsEnemy = (data: Record<string, unknown>) => enemySocket.send(JSON.stringify(data));
  const sendAsUs = (data: Record<string, unknown>) => WebsocketClient.sendMessage(data);
  const endTurn = async () => {
    sendAsUs({ event: "nextTurnRequest", value: true });
    sendAsEnemy({ event: "nextTurnRequest", value: true });
    await utils.delay(700);
  };
  const walkTo = (unit: Unit, candidates: () => Tile[]) => utils.walkTo(unit, candidates, sendAsUs, endTurn);

  runner.addStep({
    name: "Start a revealed-map game with a second player, two tiles apart and not at war",
    action: async () => {
      enemySocket = await utils.startGameWithSecondPlayer({ autoEndTurns: false, gameOptions: { startAtWar: false } });
      enemySocket.addEventListener("message", (message) => {
        const data = JSON.parse(message.data);
        if (data.event === "notifications") {
          enemyNotifications.push(...data.notifications.map((notification: NotificationData) => notification.text));
        }
      });
      await utils.waitUntil(
        () => allUnits().filter((unit) => unit.getName() === "Warrior").length === 2,
        10000,
        "Both Warriors to appear"
      );
      warrior = me()
        .getUnits()
        .find((unit) => unit.getName() === "Warrior");
      enemyWarrior = allUnits().find((unit) => unit.getPlayer() !== me() && unit.getName() === "Warrior");
    },
    verification: () => game.getCurrentScene().getName() === "in_game" && !!warrior && !!enemyWarrior
  });

  runner.addStep({
    name: "The two civilizations meet as soon as they see each other, at peace",
    action: async () => {
      await utils.waitUntil(() => !!relation(), 5000, "The other civilization to be met");
      utils.log(`Met ${relation().civName} (${relation().name})`, "yellow");
    },
    verification: () =>
      relation().atWar === false &&
      notifications().some((notification) => notification.text === `You have met ${relation().civName}.`)
  });

  runner.addStep({
    name: "At peace, our Warrior can't attack theirs even when right beside it",
    action: async () => {
      await walkTo(warrior, () => enemyWarrior.getTile().getAdjacentTiles().filter(Boolean));
      watch(warrior.getTile());
    },
    verification: () =>
      warrior.getTile().getAdjacentTiles().includes(enemyWarrior.getTile()) &&
      !warrior.canMeleeAttack(enemyWarrior.getTile()) &&
      warrior.canMeleeAttack(enemyWarrior.getTile(), { ignoreDiplomacy: true })
  });

  runner.addStep({
    name: "Ordering the attack anyway asks us to declare war first; Cancel keeps the peace",
    action: async () => {
      clientPlayer().selectUnit(warrior);
      clientPlayer()["moveSelectedUnit"](enemyWarrior.getTile());
      await utils.waitUntil(() => !!scene().getDeclareWarWindow()?.isBuilt(), 5000, "The Declare War prompt");
      await utils.delay(2000); // Long enough to read it
      if (scene().getDeclareWarWindow().getTarget() !== enemyWarrior.getPlayer())
        throw new Error("Prompt names the wrong civ");
      scene()["openUIElement"].close();
      await utils.delay(500);
    },
    verification: () => !scene().getDeclareWarWindow() && relation().atWar === false && enemyWarrior.getHealth() === 100
  });

  runner.addStep({
    name: "They found a city: its borders close to us, and our Warrior is moved out if it was standing inside",
    action: async () => {
      const enemySettler = allUnits().find((unit) => unit.getPlayer() !== me() && unit.getName() === "Settler");
      const cityTile = enemySettler.getTile();
      sendAsEnemy({
        event: "unitAction",
        unitX: cityTile.getGridX(),
        unitY: cityTile.getGridY(),
        id: enemySettler.getID(),
        actionName: "settle"
      });
      await utils.waitUntil(() => !!cityTile.getCity(), 10000, "Their city to be founded");
      enemyCity = cityTile.getCity();
      await utils.delay(500);
      watch(cityTile);
      utils.log(`Our Warrior stands at ${warrior.getTile().getGridX()},${warrior.getTile().getGridY()}`, "yellow");
    },
    verification: () => {
      const land = enemyTerritory().filter((tile) => tile !== enemyCity.getTile());
      return (
        land.length > 0 &&
        land.every((tile) => tile.isClosedBorderFor(me()) && tile.isImpassableFor(warrior)) &&
        ourUnitsInEnemyLand().length === 0
      );
    }
  });

  runner.addStep({
    name: "The diplomacy button opens a window listing them at peace, with Declare War",
    action: async () => {
      scene()["diplomacyButton"]["callbackFunction"]();
      await utils.waitUntil(() => !!window()?.isBuilt(), 5000, "The Diplomacy window");
      await utils.delay(2000);
    },
    verification: () =>
      window().getTexts().includes(relation().civName) &&
      window().getTexts().includes("At peace") &&
      rowButtons()
        .map((button) => button.getText())
        .join() === "Declare War"
  });

  runner.addStep({
    name: "Declare War asks to confirm; confirming puts both sides at war, and they're told",
    action: async () => {
      rowButtons()[0]["callbackFunction"]();
      await utils.waitUntil(() => !!scene().getDeclareWarWindow()?.isBuilt(), 5000, "The Declare War prompt");
      await utils.delay(1500);
      scene().getDeclareWarWindow().declare();
      await utils.waitUntil(() => relation().atWar, 5000, "War to be declared");
      await utils.waitUntil(
        () =>
          !!window()
            ?.getTexts()
            .some((text) => text.startsWith("At war")),
        5000,
        "The window to show the war"
      );
      await utils.delay(2000);
    },
    verification: () =>
      relation().turnsUntilPeace === 10 &&
      window().getTexts().includes("At war - peace in 10 turns") &&
      rowButtons().length === 0 &&
      enemyNotifications.some((text) => text.endsWith("has declared war on you!")) &&
      notifications().some((notification) => notification.text === `You have declared war on ${relation().civName}!`)
  });

  runner.addStep({
    name: "At war, our Warrior can attack theirs",
    action: async () => {
      scene().toggleDiplomacyUI();
      await walkTo(warrior, () => enemyWarrior.getTile().getAdjacentTiles().filter(Boolean));
      watch(warrior.getTile());
      enemyHealthBefore = enemyWarrior.getHealth();
      clientPlayer().selectUnit(warrior);
      clientPlayer()["moveSelectedUnit"](enemyWarrior.getTile());
      await utils.waitUntil(() => enemyWarrior.getHealth() < enemyHealthBefore, 5000, "Their Warrior to take damage");
      utils.log(`Their Warrior: ${enemyHealthBefore} -> ${enemyWarrior.getHealth()} HP`, "yellow");
      await utils.delay(1000);
    },
    verification: () => enemyWarrior.getHealth() < enemyHealthBefore
  });

  runner.addStep({
    name: "At war, their borders are open: our Warrior walks into their land",
    action: async () => {
      await endTurn();
      await walkTo(warrior, () => enemyTerritory().filter((tile) => tile !== enemyCity.getTile()));
      watch(warrior.getTile());
      await utils.delay(1000);
    },
    verification: () =>
      enemyTerritory().every((tile) => !tile.isClosedBorderFor(me())) &&
      warrior.getTile().getTerritoryCity() === enemyCity
  });

  runner.addStep({
    name: "They can't offer peace before the war has lasted 10 turns",
    action: async () => {
      sendAsEnemy({ event: "proposePeace", playerName: me().getName() });
      await utils.delay(800);
    },
    verification: () => relation().atWar && !relation().peaceOfferedToUs
  });

  runner.addStep({
    name: "Ten turns on, they offer peace: a notification says so",
    action: async () => {
      for (let turn = 0; turn < 10 && relation().turnsUntilPeace > 0; turn++) await endTurn();
      sendAsEnemy({ event: "proposePeace", playerName: me().getName() });
      await utils.waitUntil(() => relation().peaceOfferedToUs, 5000, "Their offer of peace");
      await utils.waitUntil(
        () => notifications().some((notification) => notification.id === "peaceOffer"),
        5000,
        "The peace offer notification"
      );
    },
    verification: () =>
      notifications().some((notification) => notification.text === `${relation().civName} offers you peace.`)
  });

  runner.addStep({
    name: "Clicking the notification opens diplomacy with Accept Peace and Refuse",
    action: async () => {
      const offer = notifications().find((notification) => notification.id === "peaceOffer");
      scene().getNotifications().act(offer);
      await utils.waitUntil(() => rowButtons().length === 2, 5000, "The peace offer's buttons");
      await utils.delay(2000);
    },
    verification: () =>
      rowButtons()
        .map((button) => button.getText())
        .join() === "Accept Peace,Refuse" && window().getTexts().includes("At war - they offer peace")
  });

  runner.addStep({
    name: "Accepting makes peace: a 10-turn treaty, no Declare War until it ends, and we leave their land",
    action: async () => {
      utils.log(`Our units in their land before peace: ${ourUnitsInEnemyLand().length}`, "yellow");
      rowButtons()[0]["callbackFunction"]();
      await utils.waitUntil(() => relation().atWar === false, 5000, "Peace to be made");
      await utils.waitUntil(
        () => !!window()?.getTexts().includes("Peace treaty - 10 turns"),
        5000,
        "The treaty to show"
      );
      await utils.delay(500);
      watch(enemyCity.getTile());
      utils.log(
        `Our Warrior was moved out to ${warrior.getTile().getGridX()},${warrior.getTile().getGridY()}`,
        "yellow"
      );
      await utils.delay(2000);
    },
    verification: () =>
      relation().treatyTurnsLeft === 10 &&
      rowButtons().length === 0 &&
      ourUnitsInEnemyLand().length === 0 &&
      enemyTerritory().every((tile) => tile === enemyCity.getTile() || tile.isClosedBorderFor(me())) &&
      notifications().some((notification) => notification.text === `You have made peace with ${relation().civName}.`)
  });

  runner.addStep({
    name: "Close the Diplomacy window",
    action: async () => {
      scene().toggleDiplomacyUI();
      await utils.delay(300);
    },
    verification: () => !window()
  });

  return runner;
}
