import { GameImage, resolveSpriteRegion, SpriteRegion } from "./Assets";
import { Game } from "./Game";
import { GameMap } from "./map/GameMap";
import { Tile } from "./map/Tile";
import { NetworkEvents } from "./network/Client";
import { AbstractPlayer } from "./player/AbstractPlayer";
import { Actor } from "./scene/Actor";
import { ActorGroup } from "./scene/ActorGroup";
import { UnitDisplayInfo } from "./ui/hud/UnitDisplayInfo";
import { FloatingText } from "./ui/components/FloatingText";
import { Strings } from "./util/Strings";

export class UnitActionManager {
  private static instance: UnitActionManager;

  private actionMap: Map<string, UnitAction>;

  private constructor() {
    this.actionMap = new Map<string, UnitAction>();
  }

  // Public static method to access the singleton instance
  public static getInstance(): UnitActionManager {
    if (!UnitActionManager.instance) {
      UnitActionManager.instance = new UnitActionManager();
    }
    return UnitActionManager.instance;
  }

  public getActionMap() {
    return this.actionMap;
  }
}

// On unit creation, the server assigns UnitActions to the unit, along with the requirements for it to be enabled
export class UnitAction {
  private actionName: string;
  private desc: string;
  private requirements: string[]; // We assign these strings to client-side functions to check if there met.
  private icon: SpriteRegion;
  // The server's say on whether the action can be taken where the unit stands (e.g. whether a Builder
  // can put a Farm on its tile) - things the client can't check for itself.
  private available: boolean;

  public constructor(actionName: string, desc: string, requirements: string[], icon: SpriteRegion, available = true) {
    this.actionName = actionName;
    this.desc = desc;
    this.requirements = requirements;
    this.icon = icon;
    this.available = available;
  }

  public static fromJSON(actionJSON: UnitActionData): UnitAction {
    return new UnitAction(
      actionJSON.name,
      actionJSON.desc,
      actionJSON.requirements,
      resolveSpriteRegion(actionJSON.icon) ?? SpriteRegion.ICON_UNKNOWN,
      actionJSON.available ?? true
    );
  }

  public getName() {
    return this.actionName;
  }

  public getDesc() {
    return this.desc;
  }

  public getIcon() {
    return this.icon;
  }

  public requirementsMet(unit: Unit): boolean {
    if (!this.available) return false;

    let allMet = true;

    for (const requirement of this.requirements) {
      const requirementMethod = (this as unknown as Record<string, Function>)[requirement];

      if (requirementMethod && !requirementMethod.call(this, unit)) {
        allMet = false;
      }
    }
    return allMet;
  }

  // Requirement methods
  protected movement(unit: Unit) {
    return unit.getAvailableMovement() > 0;
  }

  /*protected nearEnemy(unit: Unit) {
    return false;
  }*/

  protected awayFromCity(unit: Unit) {
    return true;
  }

  protected wounded(unit: Unit) {
    return unit.getHealth() < Unit.MAX_HEALTH;
  }

  protected notFortified(unit: Unit) {
    return !unit.isFortified();
  }

  protected notBuilding(unit: Unit) {
    return !unit.getBuildingImprovement();
  }
}

export interface UnitActionData {
  name: string;
  icon: string;
  requirements: string[];
  desc: string;
  available?: boolean;
}

// What a Builder is working on - both fields are absent when it isn't building anything.
export interface UnitBuildStatus {
  building?: string;
  buildingIcon?: string;
  turnsLeft?: number;
}

// Payload for constructing a Unit (server "createUnit"-style data, also embedded
// per-tile in a "mapChunk" event's units list).
export interface UnitCreationData {
  name: string;
  id: number;
  tileX: number;
  tileY: number;
  attackType: string;
  combatStrength: number;
  // Both 0 unless this is a ranged unit.
  rangedStrength: number;
  range: number;
  health: number;
  fortified: boolean;
  isUtility: boolean;
  ignoresTerrainCost: boolean;
  domain: "land" | "sea";
  coastOnly: boolean;
  remainingMovement: number;
  defaultMoveDistance: number;
  player: string;
  queuedTiles: { x: number; y: number }[];
  actions: UnitActionData[];
  // Only on the owner's own units (see server Unit.asJSON).
  building?: string;
  buildingIcon?: string;
  turnsLeft?: number;
}

export interface MoveUnitEvent {
  id: number;
  unitX: number;
  unitY: number;
  targetX: number;
  targetY: number;
  remainingMovement: number;
  queuedTiles?: { x: number; y: number }[];
}

export interface RemoveUnitEvent {
  id: number;
  unitX: number;
  unitY: number;
}

export interface ClearMovementQueueEvent {
  id: number;
}

// A melee or ranged attack. The defender fields are absent when a melee attacker overran a tile of civilians,
// or when the defender was a city (see City's own listener). The attacker fields are absent when a city fired.
export interface UnitCombatEvent {
  attackerId?: number;
  attackerHealth?: number;
  attackerRemainingMovement?: number;
  defenderId?: number;
  defenderHealth?: number;
  ranged?: boolean;
}

export interface UnitHealthEvent {
  id: number;
  health: number;
}

export class Unit extends ActorGroup {
  // Local child z-order (independent of the group's scene-level z): the sprite must
  // always draw above the selection-tile graphic, never the reverse.
  private static readonly UNIT_SPRITE_Z = 1;
  private static readonly SELECTION_TILE_Z = 0;

  // Mirrors server/src/unit/Combat.ts's MAX_HEALTH.
  public static readonly MAX_HEALTH = 100;
  // The owner's civ icon sits at the top of the unit, over a health "bubble": a disc that's green for
  // the health the unit has left and red for what it's lost, like old_java's UnitHealthBubble.
  private static readonly CIV_ICON_SIZE = 8;
  private static readonly HEALTH_BUBBLE_RADIUS = 5;

  private name: string;
  private id: number;
  private tile: Tile;
  private attackType: string;
  private combatStrength: number;
  private rangedStrength: number;
  private range: number;
  private health: number;
  private fortified: boolean;
  private utility: boolean;
  private terrainCostIgnored: boolean;
  private domain: "land" | "sea";
  private coastOnly: boolean;
  private unitActor: Actor;
  // Drawn by hand in draw() rather than as a child, so it lands on top of the health bubble.
  private civIcon: Actor | undefined;
  // Shown beside the health bubble while fortified until healed, drawn the same way as civIcon.
  private fortifyIcon: Actor;
  private selectionActors: Actor[];
  private selected: boolean;
  private defaultMoveDistance: number;
  private availableMovement: number;
  private unitDisplayInfo: UnitDisplayInfo;
  private actions: UnitAction[];
  private queuedMovementTiles: Tile[];
  private player: AbstractPlayer;
  private baseZ: number;
  private buildStatus: UnitBuildStatus;
  // The improvement being built, shown beside the health bubble like fortifyIcon.
  private buildIcon: Actor | undefined;

  constructor(tile: Tile, unitJSON: UnitCreationData) {
    super({
      x: tile.getCenterPosition().x - 28 / 2,
      y: tile.getCenterPosition().y - 28 / 2,
      z: 2,
      width: 28,
      height: 28
    });

    this.tile = tile;
    this.name = unitJSON.name;
    this.baseZ = this.getZIndex();

    this.unitActor = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: resolveSpriteRegion(`UNIT_${Strings.toConstantCase(this.name)}`),
      x: tile.getCenterPosition().x - 28 / 2,
      y: tile.getCenterPosition().y - 28 / 2,
      z: 2,
      width: 28,
      height: 28
    });

    this.addActor(this.unitActor);
    this.unitActor.setZValue(Unit.UNIT_SPRITE_Z);

    this.id = unitJSON.id;
    this.attackType = unitJSON.attackType;
    this.combatStrength = unitJSON.combatStrength;
    this.rangedStrength = unitJSON.rangedStrength ?? 0;
    this.range = unitJSON.range ?? 0;
    this.health = unitJSON.health;
    this.fortified = unitJSON.fortified ?? false;
    this.utility = unitJSON.isUtility;
    this.terrainCostIgnored = unitJSON.ignoresTerrainCost;
    this.domain = unitJSON.domain ?? "land";
    this.coastOnly = unitJSON.coastOnly ?? false;
    this.availableMovement = unitJSON.remainingMovement;
    this.defaultMoveDistance = unitJSON.defaultMoveDistance;
    this.player = AbstractPlayer.getPlayerByName(unitJSON.player);
    if (this.player) {
      this.player.addUnit(this);

      const iconRegion = resolveSpriteRegion(this.player.getCivilizationData()?.icon_name);
      if (iconRegion !== undefined) {
        const { x, y } = this.getCivIconPosition();
        this.civIcon = new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: iconRegion,
          x,
          y,
          width: Unit.CIV_ICON_SIZE,
          height: Unit.CIV_ICON_SIZE
        });
      }
    }

    this.fortifyIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_FORTIFY_HEAL,
      ...this.getFortifyIconPosition(),
      width: Unit.CIV_ICON_SIZE,
      height: Unit.CIV_ICON_SIZE
    });

    this.queuedMovementTiles = [];
    for (const jsonTile of unitJSON.queuedTiles) {
      // Only ever populated for the owner's own units (see server Unit.asJSON), and a unit can
      // only ever be queued through tiles its owner has already discovered - guarded anyway.
      const tile = GameMap.getInstance().getTiles()[jsonTile.x]?.[jsonTile.y];
      if (tile) this.queuedMovementTiles.push(tile);
    }

    this.selectionActors = [];
    this.actions = [];

    this.actions = unitJSON.actions.map((actionJSON) => UnitAction.fromJSON(actionJSON));
    this.setBuildStatus(unitJSON);

    console.log("new unit with id: " + this.id);

    NetworkEvents.on<MoveUnitEvent>({
      eventName: "moveUnit",
      parentObject: this,
      callback: (data) => {
        const unitTile = GameMap.getInstance().getTiles()[data.unitX][data.unitY];
        const targetTile = GameMap.getInstance().getTiles()[data.targetX][data.targetY];

        if (this.tile !== unitTile || this.id !== data.id) {
          return;
        }

        // Update selection location if this unit is selected
        if (this.selected) {
          this.removeSelectionActors();
        }

        this.queuedMovementTiles = [];
        this.availableMovement = data.remainingMovement;
        this.tile.removeUnit(this);
        this.tile = targetTile;
        targetTile.addUnit(this);
        this.updatePosition(targetTile);

        if (this.selected) {
          this.addSelectionActors();
        }

        // Assign queued tiles
        if (data.queuedTiles) {
          //console.log("Unit assigned a movement queue from server:");

          for (const tileJSON of data.queuedTiles) {
            const tile = GameMap.getInstance().getTiles()[tileJSON.x][tileJSON.y];
            this.queuedMovementTiles.push(tile);
          }
        }
      }
    });

    NetworkEvents.on<ClearMovementQueueEvent>({
      eventName: "clearMovementQueue",
      parentObject: this,
      callback: (data) => {
        if (this.id !== data.id) return;

        this.queuedMovementTiles = [];
      }
    });

    NetworkEvents.on<UnitCombatEvent>({
      eventName: "unitCombat",
      parentObject: this,
      callback: (data) => {
        if (this.id === data.attackerId) {
          this.showDamage(this.health - data.attackerHealth);
          this.health = data.attackerHealth;
          this.availableMovement = data.attackerRemainingMovement;
          this.queuedMovementTiles = [];
        } else if (this.id === data.defenderId) {
          this.showDamage(this.health - data.defenderHealth);
          this.health = data.defenderHealth;
        }
      }
    });

    NetworkEvents.on<{ id: number; fortified: boolean }>({
      eventName: "unitFortified",
      parentObject: this,
      callback: (data) => {
        if (this.id === data.id) this.fortified = data.fortified;
      }
    });

    NetworkEvents.on<{ id: number; actions: UnitActionData[] }>({
      eventName: "unitActions",
      parentObject: this,
      callback: (data) => {
        if (this.id === data.id) this.actions = data.actions.map((actionJSON) => UnitAction.fromJSON(actionJSON));
      }
    });

    NetworkEvents.on<UnitBuildStatus & { id: number; remainingMovement?: number }>({
      eventName: "unitBuildStatus",
      parentObject: this,
      callback: (data) => {
        if (this.id !== data.id) return;

        this.setBuildStatus(data);
        if (data.remainingMovement !== undefined) this.availableMovement = data.remainingMovement;
      }
    });

    NetworkEvents.on<UnitHealthEvent>({
      eventName: "unitHealth",
      parentObject: this,
      callback: (data) => {
        if (this.id === data.id) this.health = data.health;
      }
    });

    NetworkEvents.on({
      eventName: "newTurn",
      parentObject: this,
      callback: (data) => {
        this.availableMovement = this.defaultMoveDistance;
      }
    });
  }

  // Mirrors server/src/unit/Unit.ts's spendMovement() - keep both in sync. Roads cost a third of a
  // move, so movement is kept in exact thirds rather than drifting with floating point.
  public static spendMovement(movement: number, cost: number): number {
    return Math.max(0, Math.round((movement - cost) * 3) / 3);
  }

  // Mirrors server/src/unit/Unit.ts's canMeleeAttack() - keep both in sync. Every other
  // civilization counts as an enemy, since there's no diplomacy yet.
  public canMeleeAttack(targetTile: Tile): boolean {
    if (this.attackType !== "melee" || !this.canFight() || this.availableMovement <= 0) return false;
    if (this.tile.isWater() || targetTile.isWater()) return false;
    if (!this.tile.getAdjacentTiles().includes(targetTile)) return false;

    const city = targetTile.getCity();
    if (city && city.getPlayer() !== this.player) return true;
    return targetTile.getUnits().some((unit) => unit.getPlayer() !== this.player);
  }

  public isRanged(): boolean {
    return this.rangedStrength > 0;
  }

  public getRangedStrength(): number {
    return this.rangedStrength;
  }

  public getRange(): number {
    return this.range;
  }

  public canFight(): boolean {
    return !this.utility && this.combatStrength > 0;
  }

  public getCombatStrength(): number {
    return this.combatStrength;
  }

  public getHealth(): number {
    return this.health;
  }

  public isFortified(): boolean {
    return this.fortified;
  }

  public getBuildingImprovement(): string | undefined {
    return this.buildStatus.building;
  }

  public getBuildTurnsLeft(): number | undefined {
    return this.buildStatus.turnsLeft;
  }

  public getTileWeight(current: Tile, neighbor: Tile) {
    if (!neighbor) return current.getMovementCost();
    if (!this.canEnter(neighbor)) return 9999;

    // Pathing may route through same-type allies; whether the goal itself is free is checked by the caller.
    if (neighbor.isImpassableFor(this)) {
      return 9999;
    }

    // Mirrors the server: entering a same-type ally's tile with our whole turn's movement would still
    // leave us stopped on it, so we could never get past it. Route around instead.
    if (neighbor.isBlockedFor(this) && Tile.getWeight(current, neighbor, this) >= this.getDefaultMoveDistance()) {
      return 9999;
    }

    // Mirrors the server: open water costs a move a tile.
    if (this.domain === "sea") return 1;

    return Tile.getWeight(current, neighbor, this);
  }

  public reduceMovement(amount: number) {
    this.availableMovement -= amount;
  }

  public setAvailableMovement(amount: number) {
    this.availableMovement = amount;
  }

  public getDefaultMoveDistance() {
    return this.defaultMoveDistance;
  }

  public getAvailableMovement() {
    return this.availableMovement;
  }

  public getID() {
    return this.id;
  }

  public toString(): String {
    return JSON.stringify({ name: this.name, attackType: this.attackType });
  }

  public unselect() {
    this.selected = false;
    this.removeSelectionActors();
    Game.getInstance().getCurrentScene().removeActor(this.unitDisplayInfo);

    // Drop back below any other units stacked on this tile.
    this.setZValue(this.baseZ);
    Game.getInstance().getCurrentScene().sortSceneObjects();
  }

  public select() {
    console.log("Select Unit");
    this.selected = true;
    this.addSelectionActors();

    this.unitDisplayInfo = new UnitDisplayInfo(this);
    Game.getInstance().getCurrentScene().addActor(this.unitDisplayInfo);

    // Draw above any other units stacked on this tile.
    this.setZValue(this.baseZ + 1);
    Game.getInstance().getCurrentScene().sortSceneObjects();
  }

  // Whether a click at (x, y) landed on this unit's info window, shown while it's selected.
  public isOverDisplayInfo(x: number, y: number): boolean {
    return this.selected && (this.unitDisplayInfo?.insideActor(x, y) ?? false);
  }

  public getQueuedMovementTiles() {
    return this.queuedMovementTiles;
  }

  public getTargetQueuedTile() {
    if (this.queuedMovementTiles.length < 1) return undefined;

    return this.queuedMovementTiles[this.queuedMovementTiles.length - 1];
  }

  public hasMovementQueue() {
    return this.queuedMovementTiles.length > 0;
  }

  public getActions() {
    return this.actions;
  }

  public getName(): string {
    return this.name;
  }

  public getAttackType(): string {
    return this.attackType;
  }

  public isUtility(): boolean {
    return this.utility;
  }

  public ignoresTerrainCost(): boolean {
    return this.terrainCostIgnored;
  }

  public getDomain(): "land" | "sea" {
    return this.domain;
  }

  // Mirrors server/src/unit/Unit.ts's canEnter() - keep both in sync.
  public canEnter(tile: Tile): boolean {
    if (this.domain === "land") return !tile.isWater();

    const city = tile.getCity();
    if (city) return city.getPlayer() === this.player && tile.isCoastal();

    return tile.isWater() && !(this.coastOnly && tile.getTileTypes().includes("ocean"));
  }

  public getTile(): Tile {
    return this.tile;
  }

  public isSelected(): boolean {
    return this.selected;
  }

  /**
   * Updates the unit position, modify sub-actors locations
   * @param tile The tile we are now positioned on.
   */
  public updatePosition(tile: Tile): void {
    // Ensure group-actor location is updated
    super.setPosition(tile.getCenterPosition().x - 28 / 2, tile.getCenterPosition().y - 28 / 2);

    // Update unit sub-actor location
    this.unitActor.setPosition(tile.getCenterPosition().x - 28 / 2, tile.getCenterPosition().y - 28 / 2);

    const iconPosition = this.getCivIconPosition();
    this.civIcon?.setPosition(iconPosition.x, iconPosition.y);
    const fortifyPosition = this.getFortifyIconPosition();
    this.fortifyIcon.setPosition(fortifyPosition.x, fortifyPosition.y);
    this.buildIcon?.setPosition(fortifyPosition.x, fortifyPosition.y);
  }

  private removeSelectionActors() {
    for (const actor of this.selectionActors) {
      this.removeActor(actor);
    }
    this.selectionActors = [];

    GameMap.getInstance().removeOutline({
      tile: this.tile,
      cityOutline: false
    });
  }

  private addSelectionActors() {
    this.selectionActors.push(
      new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion.UNIT_SELECTION_TILE,
        x: this.getTile().getX(),
        y: this.getTile().getY(),
        width: 32,
        height: 32
      })
    );

    /*this.selectionActors.push(
      new Actor({
        image: Game.getImage(GameImage.UNIT_SELECTION_CIRCLE),
        x: this.getTile().getX(),
        y: this.getTile().getY(),
        width: 32,
        height: 32,
      })
    );*/

    // Keep the outline below the unit sprite, whether or not the unit is currently bumped to the front.
    GameMap.getInstance().drawUnitSelectionOutline(this.tile, "aqua", this.baseZ - 1);

    for (const actor of this.selectionActors) {
      this.addActor(actor);
      actor.setZValue(Unit.SELECTION_TILE_Z);
    }
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    // ActorGroup draws children in insertion order; sort so the selection tile
    // never paints over the unit sprite regardless of add order.
    const sortedActors = [...this.actors].sort((a, b) => a.getZIndex() - b.getZIndex());
    for (const actor of sortedActors) {
      actor.draw(canvasContext);
    }

    this.drawHealthBubble(canvasContext);
    this.civIcon?.draw(canvasContext);
    if (this.fortified) this.fortifyIcon.draw(canvasContext);
    this.buildIcon?.draw(canvasContext);
  }

  private setBuildStatus(status: UnitBuildStatus) {
    this.buildStatus = { building: status.building, buildingIcon: status.buildingIcon, turnsLeft: status.turnsLeft };

    const iconRegion = status.buildingIcon ? resolveSpriteRegion(status.buildingIcon) : undefined;
    this.buildIcon = iconRegion
      ? new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: iconRegion,
          ...this.getFortifyIconPosition(),
          width: Unit.CIV_ICON_SIZE,
          height: Unit.CIV_ICON_SIZE
        })
      : undefined;
  }

  private drawHealthBubble(canvasContext: CanvasRenderingContext2D) {
    const { x, y } = this.getCivIconPosition();
    const centerX = x + Unit.CIV_ICON_SIZE / 2;
    const centerY = y + Unit.CIV_ICON_SIZE / 2;
    const top = -Math.PI / 2;
    const healthAngle = (Math.max(0, this.health) / Unit.MAX_HEALTH) * Math.PI * 2;

    const sector = { x: centerX, y: centerY, radius: Unit.HEALTH_BUBBLE_RADIUS, canvasContext };
    Game.getInstance().drawCircleSector({ ...sector, startAngle: 0, endAngle: Math.PI * 2, color: "red" });
    if (healthAngle > 0) {
      Game.getInstance().drawCircleSector({ ...sector, startAngle: top, endAngle: top + healthAngle, color: "lime" });
    }
  }

  // "-12" rising from just under the civ icon to above it, then fading, as in Civ 5.
  private showDamage(damage: number) {
    if (damage <= 0) return;

    const { x, y } = this.getCivIconPosition();
    new FloatingText({
      text: `-${damage}`,
      color: "red",
      centerX: x + Unit.CIV_ICON_SIZE / 2,
      fromY: y + Unit.CIV_ICON_SIZE / 2 + Unit.HEALTH_BUBBLE_RADIUS + 2,
      toY: y - Unit.HEALTH_BUBBLE_RADIUS - 10
    }).show();
  }

  // Just right of the health bubble.
  private getFortifyIconPosition() {
    const { x, y } = this.getCivIconPosition();
    return { x: x + Unit.CIV_ICON_SIZE / 2 + Unit.HEALTH_BUBBLE_RADIUS + 1, y };
  }

  private getCivIconPosition() {
    // Centered over the sprite, with the bubble's bottom edge resting on the sprite's top.
    return {
      x: this.getX() + (this.getWidth() - Unit.CIV_ICON_SIZE) / 2,
      y: this.getY() - Unit.HEALTH_BUBBLE_RADIUS - Unit.CIV_ICON_SIZE / 2
    };
  }

  public getPlayer() {
    return this.player;
  }
}
