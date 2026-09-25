import { ClientSettings } from "../ClientSettings";
import { GameImage, SpriteRegion, resolveSpriteRegion } from "../Assets";
import { Game } from "../Game";
import { Unit } from "../Unit";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Strings } from "../util/Strings";
import { Label } from "./Label";
import { UITheme } from "./UITheme";

// Server "combatPreview" payload, from Unit.getMeleePreview(). Only sent when something on the target
// tile can fight back - civilians are captured without a preview.
export interface CombatPreviewEvent {
  attackerId: number;
  defenderId: number;
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

interface HealthRing {
  centerX: number;
  centerY: number;
  health: number;
  damage: { min: number; max: number };
}

const WINDOW_WIDTH = 440;
const WINDOW_HEIGHT = 165;
const PADDING = 14;
// Each side's unit, ring and labels are centered in a column this wide, leaving the middle to the outcome.
const SIDE_COLUMN_WIDTH = 140;
const UNIT_SIZE = 44;
const CIV_ICON_SIZE = 26;
const RING_RADIUS = 20;
const OUTCOME_ICON_SIZE = 44;
const SMALL_FONT = "18px serif";
const LEGEND_FONT = "14px serif";
// Matches UnitDisplayInfo's WINDOW_HEIGHT - this window stacks right on top of it.
const UNIT_INFO_HEIGHT = 170;

/**
 * Attacker on the left, defender on the right, the likely outcome between them. Each side's civ icon
 * sits in a health ring like the one over units on the map: green is health it keeps whatever the roll,
 * yellow is what the roll decides, red is what it loses either way.
 */
export class CombatPreviewWindow extends ActorGroup {
  private rings: HealthRing[] = [];
  private civIcons: Actor[] = [];

  constructor(attacker: Unit, defender: Unit, preview: CombatPreviewEvent) {
    super({
      x: Game.getInstance().getWidth() - WINDOW_WIDTH,
      y: Game.getInstance().getHeight() - UNIT_INFO_HEIGHT - WINDOW_HEIGHT - 8,
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

    this.addCenteredLabel("Combat Preview", this.x + this.width / 2, this.y + 8, UITheme.FONT);

    const rowCenterY = this.y + 64;
    const sideWidth = UNIT_SIZE + 10 + RING_RADIUS * 2;
    const leftCenterX = this.x + PADDING + SIDE_COLUMN_WIDTH / 2;
    const rightCenterX = this.x + this.width - PADDING - SIDE_COLUMN_WIDTH / 2;
    const leftX = leftCenterX - sideWidth / 2;
    const rightX = rightCenterX - sideWidth / 2;

    // Attacker: unit, then its ring. Defender mirrored: ring, then unit.
    this.addUnitSprite(attacker, leftX, rowCenterY);
    this.addRing(attacker, leftX + sideWidth - RING_RADIUS, rowCenterY, preview.attackerHealth, preview.attackerDamage);
    this.addSideLabels(attacker, leftCenterX, rowCenterY, preview.attackerHealth, preview.attackerDamage);

    this.addRing(defender, rightX + RING_RADIUS, rowCenterY, preview.defenderHealth, preview.defenderDamage);
    this.addUnitSprite(defender, rightX + sideWidth - UNIT_SIZE, rowCenterY);
    this.addSideLabels(defender, rightCenterX, rowCenterY, preview.defenderHealth, preview.defenderDamage);

    this.addOutcome(preview.outcome, this.x + this.width / 2, rowCenterY);

    this.addCenteredLabel(
      "Yellow health depends on the roll",
      this.x + this.width / 2,
      this.y + this.height - 24,
      LEGEND_FONT
    );
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

  private addUnitSprite(unit: Unit, x: number, centerY: number) {
    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: resolveSpriteRegion(`UNIT_${Strings.toConstantCase(unit.getName())}`),
        x,
        y: centerY - UNIT_SIZE / 2,
        width: UNIT_SIZE,
        height: UNIT_SIZE
      })
    );
  }

  private addRing(unit: Unit, centerX: number, centerY: number, health: number, damage: { min: number; max: number }) {
    this.rings.push({ centerX, centerY, health, damage });

    const iconRegion = resolveSpriteRegion(unit.getPlayer()?.getCivilizationData()?.icon_name);
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

  // Name, then e.g. "100 → 58-70 HP": health now, and the range it can end the fight on.
  private addSideLabels(
    unit: Unit,
    centerX: number,
    rowCenterY: number,
    health: number,
    damage: { min: number; max: number }
  ) {
    const worst = Math.max(0, health - damage.max);
    const best = Math.max(0, health - damage.min);
    const range = worst === best ? `${best}` : `${worst}-${best}`;

    this.addCenteredLabel(Strings.capitalizeWords(unit.getName()), centerX, rowCenterY + 28, SMALL_FONT);
    this.addCenteredLabel(`${health} → ${range} HP`, centerX, rowCenterY + 50, SMALL_FONT);
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
        y: rowCenterY - OUTCOME_ICON_SIZE / 2 - 6,
        width: OUTCOME_ICON_SIZE,
        height: OUTCOME_ICON_SIZE
      })
    );
    this.addCenteredLabel(outcome, centerX, rowCenterY + 20, SMALL_FONT, color);
  }

  // Clockwise from 12 o'clock: green for health kept on any roll, yellow for health the roll decides,
  // red for health lost on any roll.
  private drawRing(ring: HealthRing, canvasContext: CanvasRenderingContext2D) {
    const game = Game.getInstance();
    const top = -Math.PI / 2;
    const toAngle = (health: number) =>
      (Math.max(0, Math.min(Unit.MAX_HEALTH, health)) / Unit.MAX_HEALTH) * Math.PI * 2;
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
