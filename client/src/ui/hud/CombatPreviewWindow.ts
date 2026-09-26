import { ClientSettings } from "../../ClientSettings";
import { GameImage, SpriteRegion, resolveSpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { Unit } from "../../Unit";
import { City } from "../../city/City";
import { AbstractPlayer } from "../../player/AbstractPlayer";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { Strings } from "../../util/Strings";
import { Label } from "../components/Label";
import { UnitDisplayInfo } from "./UnitDisplayInfo";
import { UITheme } from "../UITheme";

// Server "combatPreview" payload, from Unit.getMeleePreview()/getRangedPreview() or City.getStrikePreview().
// Only sent when something on the target tile can fight back - civilians are captured without a preview.
// Each side is a unit (its id) or a city (its name, with its own maximum health).
export interface CombatPreviewEvent {
  attackerId?: number;
  attackerCity?: string;
  attackerMaxHealth?: number;
  // A ranged attack, where the attacker takes no damage.
  ranged?: boolean;
  defenderId?: number;
  defenderCity?: string;
  defenderMaxHealth?: number;
  targetX: number;
  targetY: number;
  attackerHealth: number;
  defenderHealth: number;
  // Damage each side takes on the worst, average and best roll.
  attackerDamage: { min: number; expected: number; max: number };
  defenderDamage: { min: number; expected: number; max: number };
  // "Decisive Victory", "Minor Defeat", "Stalemate", ... from the average roll.
  outcome: string;
}

// One side of the fight, as the window draws it.
export interface CombatSide {
  spriteRegion: SpriteRegion;
  player: AbstractPlayer;
  maxHealth: number;
}

interface HealthRing {
  centerX: number;
  centerY: number;
  health: number;
  maxHealth: number;
  damage: { min: number; max: number };
}

// Matches UnitDisplayInfo's WINDOW_WIDTH.
const WINDOW_WIDTH = 300;
const WINDOW_HEIGHT = 152;
const PADDING = 10;
// Each side's unit, ring and labels are centered in a column this wide, leaving the middle to the outcome.
const SIDE_COLUMN_WIDTH = 90;
const UNIT_SIZE = 44;
const CIV_ICON_SIZE = 26;
const RING_RADIUS = 20;
const OUTCOME_ICON_SIZE = 36;

/**
 * Attacker on the left, defender on the right, the likely outcome between them. Each side's civ icon
 * sits in a health ring like the one over units on the map: green is health it keeps whatever the roll,
 * yellow is what the roll decides, red is what it loses either way.
 */
export class CombatPreviewWindow extends ActorGroup {
  private rings: HealthRing[] = [];
  private civIcons: Actor[] = [];

  constructor(attacker: CombatSide, defender: CombatSide, preview: CombatPreviewEvent) {
    super({
      x: Game.getInstance().getWidth() - WINDOW_WIDTH,
      y: Game.getInstance().getHeight() - UnitDisplayInfo.HEIGHT - WINDOW_HEIGHT - 8,
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
      cameraApplies: false,
      z: 5
    });

    this.setTransparency(ClientSettings.get("HUD_TRANSPARENCY"));
    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        nineSlice: true,
        cornerSize: 20
      })
    );

    this.addCenteredLabel(CombatPreviewWindow.getTitle(preview), this.x + this.width / 2, this.y + 8, UITheme.FONT);

    const rowCenterY = this.y + 62;
    const sideWidth = UNIT_SIZE + 6 + RING_RADIUS * 2;
    const leftCenterX = this.x + PADDING + SIDE_COLUMN_WIDTH / 2;
    const rightCenterX = this.x + this.width - PADDING - SIDE_COLUMN_WIDTH / 2;
    const leftX = leftCenterX - sideWidth / 2;
    const rightX = rightCenterX - sideWidth / 2;

    // Attacker: unit, then its ring. Defender mirrored: ring, then unit.
    this.addSideSprite(attacker, leftX, rowCenterY);
    this.addRing(attacker, leftX + sideWidth - RING_RADIUS, rowCenterY, preview.attackerHealth, preview.attackerDamage);
    this.addSideLabels(leftCenterX, rowCenterY, preview.attackerHealth, preview.attackerDamage);

    this.addRing(defender, rightX + RING_RADIUS, rowCenterY, preview.defenderHealth, preview.defenderDamage);
    this.addSideSprite(defender, rightX + sideWidth - UNIT_SIZE, rowCenterY);
    this.addSideLabels(rightCenterX, rowCenterY, preview.defenderHealth, preview.defenderDamage);

    this.addOutcome(preview.outcome, this.x + this.width / 2, rowCenterY);
  }

  public static unitSide(unit: Unit): CombatSide {
    return {
      spriteRegion: resolveSpriteRegion(`UNIT_${Strings.toConstantCase(unit.getName())}`),
      player: unit.getPlayer(),
      maxHealth: Unit.MAX_HEALTH
    };
  }

  public static citySide(city: City): CombatSide {
    return { spriteRegion: SpriteRegion.TILE_CITY, player: city.getPlayer(), maxHealth: city.getMaxHealth() };
  }

  private static getTitle(preview: CombatPreviewEvent): string {
    if (preview.attackerCity) return "City Attack";
    if (preview.ranged) return "Ranged Attack";
    return "Combat Preview";
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    super.draw(canvasContext);

    canvasContext.save();
    canvasContext.globalAlpha = this.transparency;
    for (const ring of this.rings) {
      this.drawRing(ring, canvasContext);
    }
    canvasContext.restore();

    // After the rings, so each icon sits on top of its ring.
    for (const civIcon of this.civIcons) {
      civIcon.draw(canvasContext);
    }
  }

  private addSideSprite(side: CombatSide, x: number, centerY: number) {
    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: side.spriteRegion,
        x,
        y: centerY - UNIT_SIZE / 2,
        width: UNIT_SIZE,
        height: UNIT_SIZE
      })
    );
  }

  private addRing(
    side: CombatSide,
    centerX: number,
    centerY: number,
    health: number,
    damage: { min: number; max: number }
  ) {
    this.rings.push({ centerX, centerY, health, maxHealth: side.maxHealth, damage });

    const iconRegion = resolveSpriteRegion(side.player?.getCivilizationData()?.icon_name);
    if (iconRegion === undefined) return;

    const civIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: iconRegion,
      x: centerX - CIV_ICON_SIZE / 2,
      y: centerY - CIV_ICON_SIZE / 2,
      width: CIV_ICON_SIZE,
      height: CIV_ICON_SIZE,
      cameraApplies: false
    });
    civIcon.setTransparency(this.transparency);
    this.civIcons.push(civIcon);
  }

  // The range of health it can end the fight on, e.g. "58-70". The unit's name is left to its sprite,
  // since a UITheme.FONT name like "Composite Bowman" wouldn't fit the column.
  private addSideLabels(centerX: number, rowCenterY: number, health: number, damage: { min: number; max: number }) {
    const worst = Math.max(0, health - damage.max);
    const best = Math.max(0, health - damage.min);
    const range = worst === best ? `${best}` : `${worst}-${best}`;

    this.addCenteredLabel(range, centerX, rowCenterY + 30, UITheme.FONT);
  }

  private addOutcome(outcome: string, centerX: number, rowCenterY: number) {
    let icon = SpriteRegion.ICON_DEFENSE;
    let color = "white";
    if (outcome.includes("Victory")) {
      icon = SpriteRegion.ICON_ACCEPT;
      color = "lime";
    } else if (outcome.includes("Defeat")) {
      icon = SpriteRegion.ICON_CANCEL;
      color = "#ff6060";
    }

    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: icon,
        x: centerX - OUTCOME_ICON_SIZE / 2,
        y: rowCenterY - OUTCOME_ICON_SIZE / 2,
        width: OUTCOME_ICON_SIZE,
        height: OUTCOME_ICON_SIZE
      })
    );
    // One word per line, so "Decisive Victory" fits the narrow middle at UITheme.FONT.
    outcome.split(" ").forEach((word, line) => {
      this.addCenteredLabel(word, centerX, rowCenterY + 30 + line * UITheme.FONT_SIZE, UITheme.FONT, color);
    });
  }

  // Clockwise from 12 o'clock: green for health kept on any roll, yellow for health the roll decides,
  // red for health lost on any roll.
  private drawRing(ring: HealthRing, canvasContext: CanvasRenderingContext2D) {
    const game = Game.getInstance();
    const top = -Math.PI / 2;
    const toAngle = (health: number) =>
      (Math.max(0, Math.min(ring.maxHealth, health)) / ring.maxHealth) * Math.PI * 2;
    const sector = {
      x: ring.centerX,
      y: ring.centerY,
      radius: RING_RADIUS,
      canvasContext,
      cameraApplies: false
    };

    game.drawCircleSector({ ...sector, startAngle: 0, endAngle: Math.PI * 2, color: "red" });
    const best = toAngle(ring.health - ring.damage.min);
    if (best > 0) game.drawCircleSector({ ...sector, startAngle: top, endAngle: top + best, color: "gold" });
    const worst = toAngle(ring.health - ring.damage.max);
    if (worst > 0) game.drawCircleSector({ ...sector, startAngle: top, endAngle: top + worst, color: "lime" });
  }

  private addCenteredLabel(text: string, centerX: number, y: number, font: string, fontColor = "white") {
    const label = new Label({ text, font, fontColor });
    label.conformSize().then(() => {
      label.setPosition(centerX - label.getWidth() / 2, y);
      this.addActor(label);
    });
  }
}
