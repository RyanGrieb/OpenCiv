import { PlayerDiplomacy } from "../../src/diplomacy/PlayerDiplomacy";
import { Game } from "../../src/Game";
import { Player } from "../../src/Player";
import { City } from "../../src/city/City";
import { Tile } from "../../src/map/Tile";
import { Unit } from "../../src/unit/Unit";

jest.mock("../../src/Events");

describe("PlayerDiplomacy", () => {
  let rome: Player;
  let mongolia: Player;
  let england: Player;
  let barbarians: Player;

  const makePlayer = (name: string, civName: string, barbarian = false) => {
    const player = new Player(name);
    player.setCivilizationData({ name: civName, icon_name: `ICON_${civName.toUpperCase()}`, barbarian });
    jest.spyOn(player, "sendNetworkEvent").mockImplementation(() => {});
    return player;
  };

  const messages = (player: Player) =>
    player
      .getNotifications()
      .getNotifications()
      .map((notification) => notification.text);

  const passTurns = (turns: number) => {
    for (let turn = 0; turn < turns; turn++) {
      [rome, mongolia, england].forEach((player) => player.getDiplomacy().passTurn());
    }
  };

  // A tile inside `owner`'s borders.
  const territoryTile = (owner: Player) => {
    const tile = new Tile("grassland", 0, 0);
    tile.setCityTerritoryOf({ getPlayer: () => owner } as unknown as City);
    return tile;
  };

  beforeEach(() => {
    rome = makePlayer("Player1", "Rome");
    mongolia = makePlayer("Player2", "Mongolia");
    england = makePlayer("Player3", "England");
    barbarians = makePlayer("Barbarians", "Barbarians", true);

    const players = new Map([rome, mongolia, england].map((player) => [player.getName(), player]));
    jest.spyOn(Game, "getInstance").mockReturnValue({ getPlayers: () => players } as unknown as Game);
  });

  afterEach(() => jest.restoreAllMocks());

  it("starts every civilization unmet and at peace, but always at war with the barbarians", () => {
    expect(rome.getDiplomacy().hasMet(mongolia)).toBe(false);
    expect(PlayerDiplomacy.areAtWar(rome, mongolia)).toBe(false);
    expect(PlayerDiplomacy.areAtWar(rome, rome)).toBe(false);
    expect(PlayerDiplomacy.areAtWar(rome, barbarians)).toBe(true);
    expect(PlayerDiplomacy.areAtWar(barbarians, mongolia)).toBe(true);
  });

  it("meets both ways at once, with a notification for each side", () => {
    rome.getDiplomacy().meet(mongolia);

    expect(rome.getDiplomacy().hasMet(mongolia)).toBe(true);
    expect(mongolia.getDiplomacy().hasMet(rome)).toBe(true);
    expect(messages(rome)).toContain("You have met Mongolia.");
    expect(messages(mongolia)).toContain("You have met Rome.");
  });

  it("never meets the barbarians", () => {
    rome.getDiplomacy().meet(barbarians);

    expect(rome.getDiplomacy().hasMet(barbarians)).toBe(false);
    expect(rome.getDiplomacy().toJSON()).toEqual([]);
  });

  it("meets whoever has a unit or land on a tile in sight", () => {
    const tileWithUnit = new Tile("grassland", 0, 0);
    tileWithUnit.addUnit({ getPlayer: () => mongolia } as unknown as Unit);

    rome.getDiplomacy().meetPlayersOn([tileWithUnit, territoryTile(england)]);

    expect(rome.getDiplomacy().hasMet(mongolia)).toBe(true);
    expect(rome.getDiplomacy().hasMet(england)).toBe(true);
  });

  it("only lets a civilization declare war on one it has met", () => {
    rome.getDiplomacy().declareWar(mongolia);
    expect(PlayerDiplomacy.areAtWar(rome, mongolia)).toBe(false);

    rome.getDiplomacy().meet(mongolia);
    rome.getDiplomacy().declareWar(mongolia);

    expect(PlayerDiplomacy.areAtWar(rome, mongolia)).toBe(true);
    expect(PlayerDiplomacy.areAtWar(mongolia, rome)).toBe(true);
    expect(messages(mongolia)).toContain("Rome has declared war on you!");
  });

  it("tells a third civilization that knows both sides about the war", () => {
    rome.getDiplomacy().meet(mongolia);
    england.getDiplomacy().meet(rome);
    england.getDiplomacy().meet(mongolia);

    rome.getDiplomacy().declareWar(mongolia);

    expect(messages(england)).toContain("Rome has declared war on Mongolia!");
  });

  it(`won't take an offer of peace until the war has run ${PlayerDiplomacy.MIN_WAR_TURNS} turns`, () => {
    rome.getDiplomacy().meet(mongolia);
    rome.getDiplomacy().declareWar(mongolia);
    passTurns(PlayerDiplomacy.MIN_WAR_TURNS - 1);

    mongolia.getDiplomacy().proposePeace(rome);
    expect(rome.getDiplomacy().hasPeaceOfferFrom(mongolia)).toBe(false);
    expect(mongolia.getDiplomacy().toJSON()[0].turnsUntilPeace).toBe(1);

    passTurns(1);
    mongolia.getDiplomacy().proposePeace(rome);
    expect(rome.getDiplomacy().hasPeaceOfferFrom(mongolia)).toBe(true);
    expect(PlayerDiplomacy.areAtWar(rome, mongolia)).toBe(true);
  });

  it("makes peace once the other side accepts, then holds a treaty against a new war", () => {
    rome.getDiplomacy().meet(mongolia);
    rome.getDiplomacy().declareWar(mongolia);
    passTurns(PlayerDiplomacy.MIN_WAR_TURNS);

    mongolia.getDiplomacy().proposePeace(rome);
    rome.getDiplomacy().proposePeace(mongolia);

    expect(PlayerDiplomacy.areAtWar(rome, mongolia)).toBe(false);
    expect(messages(rome)).toContain("You have made peace with Mongolia.");
    expect(rome.getDiplomacy().toJSON()[0].treatyTurnsLeft).toBe(PlayerDiplomacy.PEACE_TREATY_TURNS);

    rome.getDiplomacy().declareWar(mongolia);
    expect(PlayerDiplomacy.areAtWar(rome, mongolia)).toBe(false);

    passTurns(PlayerDiplomacy.PEACE_TREATY_TURNS);
    rome.getDiplomacy().declareWar(mongolia);
    expect(PlayerDiplomacy.areAtWar(rome, mongolia)).toBe(true);
  });

  it("lets the other side refuse an offer of peace", () => {
    rome.getDiplomacy().meet(mongolia);
    rome.getDiplomacy().declareWar(mongolia);
    passTurns(PlayerDiplomacy.MIN_WAR_TURNS);

    mongolia.getDiplomacy().proposePeace(rome);
    rome.getDiplomacy().declinePeace(mongolia);

    expect(rome.getDiplomacy().hasPeaceOfferFrom(mongolia)).toBe(false);
    expect(PlayerDiplomacy.areAtWar(rome, mongolia)).toBe(true);
    expect(messages(mongolia)).toContain("Rome refused your offer of peace.");
  });

  it("puts everyone at war with everyone for the startAtWar option", () => {
    PlayerDiplomacy.declareWarAmongAll([rome, mongolia, england]);

    expect(PlayerDiplomacy.areAtWar(rome, mongolia)).toBe(true);
    expect(PlayerDiplomacy.areAtWar(england, rome)).toBe(true);
    expect(mongolia.getDiplomacy().hasMet(england)).toBe(true);
  });

  describe("borders", () => {
    it("are closed to a civilization at peace, and open to one at war", () => {
      const romanLand = territoryTile(rome);
      rome.getDiplomacy().meet(mongolia);

      expect(romanLand.isClosedBorderFor(rome)).toBe(false);
      expect(romanLand.isClosedBorderFor(mongolia)).toBe(true);
      expect(romanLand.isClosedBorderFor(barbarians)).toBe(false);

      rome.getDiplomacy().declareWar(mongolia);
      expect(romanLand.isClosedBorderFor(mongolia)).toBe(false);
    });

    it("turn back a unit that tries to walk in", () => {
      rome.getDiplomacy().meet(mongolia);
      const mongolWarrior = { getPlayer: () => mongolia } as unknown as Unit;

      expect(territoryTile(rome).isImpassableFor(mongolWarrior)).toBe(true);
      expect(new Tile("grassland", 1, 0).isImpassableFor(mongolWarrior)).toBe(false);
    });
  });
});
