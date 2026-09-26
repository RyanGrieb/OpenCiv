import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { Player } from "../Player";
import { Tile } from "../map/Tile";
import { Unit } from "../unit/Unit";

// What a player's client is told about one civilization they've met - see PlayerDiplomacy.toJSON().
export interface RelationJSON {
  name: string;
  civName: string;
  iconName: string;
  atWar: boolean;
  // Turns until peace can be offered, while at war. 0 once it can.
  turnsUntilPeace: number;
  // Turns left on the peace treaty, during which neither side may declare war. 0 once it's over.
  treatyTurnsLeft: number;
  peaceOfferedToUs: boolean;
  peaceOfferedByUs: boolean;
}

/**
 * Civ 5 war and peace, from one player's side. Civilizations meet the first time one sees the
 * other's units or land, and start out at peace: neither can attack the other, and neither can
 * enter the other's borders (there's no Open Borders yet). A war lasts at least MIN_WAR_TURNS before
 * either side may offer peace, and peace needs the other side to accept. Making peace signs a treaty
 * that stops either side declaring war again for PEACE_TREATY_TURNS.
 *
 * Every relation is mutual, so each change is made on both players' PlayerDiplomacy at once. The
 * barbarians are at war with everyone, always, and never met - see areAtWar().
 */
export class PlayerDiplomacy {
  public static readonly MIN_WAR_TURNS = 10;
  public static readonly PEACE_TREATY_TURNS = 10;

  private player: Player;
  private met: Set<Player>;
  // Each enemy, with the turns the war has lasted.
  private wars: Map<Player, number>;
  // Each former enemy still under a peace treaty, with the turns it has left.
  private treaties: Map<Player, number>;
  // Players who've offered this player peace and are waiting on an answer.
  private peaceOffers: Set<Player>;

  constructor(player: Player) {
    this.player = player;
    this.met = new Set();
    this.wars = new Map();
    this.treaties = new Map();
    this.peaceOffers = new Set();

    ServerEvents.on({
      eventName: "requestDiplomacy",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.sendUpdate();
      },
      globalEvent: true
    });
    this.onClientEvent("declareWar", (other) => this.declareWar(other));
    this.onClientEvent("proposePeace", (other) => this.proposePeace(other));
    this.onClientEvent("declinePeace", (other) => this.declinePeace(other));
  }

  /** Whether units of these two players fight rather than get in each other's way. */
  public static areAtWar(a: Player, b: Player): boolean {
    if (a === b) return false;
    if (a.isBarbarian() || b.isBarbarian()) return true;

    return a.getDiplomacy().isAtWarWith(b);
  }

  // The startAtWar game option: every civilization has met and is at war with every other from the
  // first turn, as they were before there was any diplomacy. What the combat scenarios play under.
  public static declareWarAmongAll(players: Player[]) {
    for (const player of players) {
      for (const other of players) {
        if (player === other) continue;

        player.getDiplomacy().met.add(other);
        player.getDiplomacy().wars.set(other, PlayerDiplomacy.MIN_WAR_TURNS);
      }
    }
  }

  public hasMet(other: Player): boolean {
    return this.met.has(other);
  }

  public isAtWarWith(other: Player): boolean {
    return this.wars.has(other);
  }

  public hasPeaceOfferFrom(other: Player): boolean {
    return this.peaceOffers.has(other);
  }

  public canDeclareWarOn(other: Player): boolean {
    return this.met.has(other) && !this.wars.has(other) && !this.treaties.has(other);
  }

  public canProposePeaceTo(other: Player): boolean {
    return this.getTurnsUntilPeace(other) === 0 && !other.getDiplomacy().peaceOffers.has(this.player);
  }

  /**
   * Meets every civilization with a unit, a city or land among `tiles` - what this player can see.
   * Called whenever their sight is recomputed.
   */
  public meetPlayersOn(tiles: Iterable<Tile>) {
    for (const tile of tiles) {
      for (const owner of PlayerDiplomacy.getOwnersOn(tile)) {
        this.meet(owner);
      }
    }
  }

  public meet(other: Player) {
    if (other === this.player || other.isBarbarian() || this.met.has(other)) return;

    this.met.add(other);
    other.getDiplomacy().met.add(this.player);

    this.player.getNotifications().addMessage(other.getCivIconName(), `You have met ${PlayerDiplomacy.civName(other)}.`);
    other.getNotifications().addMessage(this.player.getCivIconName(), `You have met ${PlayerDiplomacy.civName(this.player)}.`);
    console.log(`[Diplomacy] ${this.player.getName()} met ${other.getName()}`);

    // At peace from the start, so neither may stand inside the other's borders.
    PlayerDiplomacy.expelFromLandsOf(this.player);
    PlayerDiplomacy.expelFromLandsOf(other);

    this.sendUpdate();
    other.getDiplomacy().sendUpdate();
  }

  public declareWar(other: Player) {
    if (!this.canDeclareWarOn(other)) return;

    this.wars.set(other, 0);
    other.getDiplomacy().wars.set(this.player, 0);
    this.peaceOffers.delete(other);
    other.getDiplomacy().peaceOffers.delete(this.player);

    console.log(`[Diplomacy] ${this.player.getName()} declared war on ${other.getName()}`);
    this.player.getNotifications().addMessage("ICON_COMBAT", `You have declared war on ${PlayerDiplomacy.civName(other)}!`);
    other.getNotifications().addMessage("ICON_COMBAT", `${PlayerDiplomacy.civName(this.player)} has declared war on you!`);
    this.announceToOthers(
      other,
      "ICON_COMBAT",
      `${PlayerDiplomacy.civName(this.player)} has declared war on ${PlayerDiplomacy.civName(other)}!`
    );

    this.sendUpdate();
    other.getDiplomacy().sendUpdate();
  }

  /**
   * Offers peace, or accepts it if the other side already offered. Peace only ever takes both sides
   * agreeing, and neither may offer until the war has run MIN_WAR_TURNS.
   */
  public proposePeace(other: Player) {
    if (this.peaceOffers.has(other)) {
      this.makePeace(other);
      return;
    }
    if (!this.canProposePeaceTo(other)) return;

    other.getDiplomacy().peaceOffers.add(this.player);
    this.player.getNotifications().addMessage(other.getCivIconName(), `You offered peace to ${PlayerDiplomacy.civName(other)}.`);

    this.sendUpdate();
    other.getDiplomacy().sendUpdate();
  }

  public declinePeace(other: Player) {
    if (!this.peaceOffers.delete(other)) return;

    other
      .getNotifications()
      .addMessage(this.player.getCivIconName(), `${PlayerDiplomacy.civName(this.player)} refused your offer of peace.`);

    this.sendUpdate();
    other.getDiplomacy().sendUpdate();
  }

  /** A turn went by: wars age, and treaties run down. */
  public passTurn() {
    for (const [enemy, turns] of this.wars) {
      this.wars.set(enemy, turns + 1);
    }

    for (const [former, turnsLeft] of this.treaties) {
      if (turnsLeft <= 1) {
        this.treaties.delete(former);
        continue;
      }
      this.treaties.set(former, turnsLeft - 1);
    }

    this.sendUpdate();
  }

  public sendUpdate() {
    this.player.sendNetworkEvent({ event: "diplomacyUpdate", players: this.toJSON() });
  }

  public toJSON(): RelationJSON[] {
    return Array.from(this.met).map((other) => ({
      name: other.getName(),
      civName: PlayerDiplomacy.civName(other),
      iconName: other.getCivIconName(),
      atWar: this.wars.has(other),
      turnsUntilPeace: this.getTurnsUntilPeace(other),
      treatyTurnsLeft: this.treaties.get(other) ?? 0,
      peaceOfferedToUs: this.peaceOffers.has(other),
      peaceOfferedByUs: other.getDiplomacy().peaceOffers.has(this.player)
    }));
  }

  // Every player in a game has a civ by the time they can meet anyone; the name is a fallback.
  private static civName(player: Player): string {
    return player.getCivilizationName() ?? player.getName();
  }

  // The civilizations, other than the barbarians, with something on the tile: a unit, a city, or land.
  private static getOwnersOn(tile: Tile): Player[] {
    const owners = tile.getUnits().map((unit) => unit.getPlayer());
    const territoryOwner = (tile.getCity() ?? tile.getCityTerritoryOf())?.getPlayer();
    if (territoryOwner) owners.push(territoryOwner);

    return owners.filter((owner) => !owner.isBarbarian());
  }

  /**
   * Civ 5 moves anyone standing inside a civilization's borders without the right to be there - at
   * peace, with no Open Borders - out to the nearest tile they may stand on. Called whenever that can
   * start being the case: borders claiming land, a city changing hands, peace being made.
   */
  public static expelTrespassers(tiles: Tile[]) {
    for (const tile of tiles) {
      for (const unit of [...tile.getUnits()]) {
        if (!tile.isClosedBorderFor(unit.getPlayer())) continue;

        const destination = PlayerDiplomacy.findTileOutsideBorders(unit);
        if (!destination) continue;

        unit.moveToTile({
          previousTile: tile,
          targetTile: destination,
          remainingTiles: [],
          remainingMovement: unit.getAvailableMovement()
        });
      }
    }
  }

  private static expelFromLandsOf(owner: Player) {
    PlayerDiplomacy.expelTrespassers(owner.getCities().flatMap((city) => city.getTerritory()));
  }

  // The closest tile, walking outwards, that `unit` may stand on: open to its owner, and free.
  private static findTileOutsideBorders(unit: Unit): Tile | undefined {
    const seen = new Set<Tile>([unit.getTile()]);
    let frontier = [unit.getTile()];

    while (frontier.length > 0) {
      const next: Tile[] = [];

      for (const tile of frontier) {
        for (const neighbor of tile.getAdjacentTiles()) {
          if (!neighbor || seen.has(neighbor)) continue;
          seen.add(neighbor);
          next.push(neighbor);

          if (PlayerDiplomacy.canBeExpelledTo(unit, neighbor)) return neighbor;
        }
      }

      frontier = next;
    }

    return undefined;
  }

  private static canBeExpelledTo(unit: Unit, tile: Tile): boolean {
    if (!unit.canEnter(tile) || tile.getMovementCost() >= 9999) return false;

    return !tile.isBlockedFor(unit);
  }

  private makePeace(other: Player) {
    this.peaceOffers.delete(other);
    other.getDiplomacy().peaceOffers.delete(this.player);
    this.wars.delete(other);
    other.getDiplomacy().wars.delete(this.player);
    this.treaties.set(other, PlayerDiplomacy.PEACE_TREATY_TURNS);
    other.getDiplomacy().treaties.set(this.player, PlayerDiplomacy.PEACE_TREATY_TURNS);

    console.log(`[Diplomacy] ${this.player.getName()} made peace with ${other.getName()}`);
    this.player.getNotifications().addMessage("ICON_DIPLOMACY", `You have made peace with ${PlayerDiplomacy.civName(other)}.`);
    other.getNotifications().addMessage("ICON_DIPLOMACY", `You have made peace with ${PlayerDiplomacy.civName(this.player)}.`);
    this.announceToOthers(
      other,
      "ICON_DIPLOMACY",
      `${PlayerDiplomacy.civName(this.player)} and ${PlayerDiplomacy.civName(other)} have made peace.`
    );

    PlayerDiplomacy.expelFromLandsOf(this.player);
    PlayerDiplomacy.expelFromLandsOf(other);

    this.sendUpdate();
    other.getDiplomacy().sendUpdate();
  }

  // Everyone else who knows both sides hears about a war or a peace between them.
  private announceToOthers(other: Player, icon: string, text: string) {
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        if (player === this.player || player === other) return;
        if (!player.getDiplomacy().hasMet(this.player) || !player.getDiplomacy().hasMet(other)) return;

        player.getNotifications().addMessage(icon, text);
      });
  }

  private getTurnsUntilPeace(other: Player): number {
    const turnsAtWar = this.wars.get(other);
    if (turnsAtWar === undefined) return 0;

    return Math.max(0, PlayerDiplomacy.MIN_WAR_TURNS - turnsAtWar);
  }

  // A request from this player's client about another player, named in the message.
  private onClientEvent(eventName: string, callback: (other: Player) => void) {
    ServerEvents.on({
      eventName,
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        const other = Game.getInstance().getPlayers().get(data["playerName"]);
        if (!other) return;

        callback(other);
      },
      globalEvent: true
    });
  }
}
