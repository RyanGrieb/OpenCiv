import { ClientSettings } from "../ClientSettings";
import { GameImage, SpriteRegion, resolveSpriteRegion } from "../Assets";
import { Game } from "../Game";
import { Unit } from "../Unit";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Strings } from "../util/Strings";
import { Label } from "./Label";

// Server "combatPreview" payload, from Unit.getMeleePreview(). Only sent when something on the target
// tile can fight back - civilians are captured without a preview.
export interface CombatPreviewEvent {
  attackerId: number;
  defenderId: number;
  targetX: number;
  targetY: number;
  attackerHealth: number;
  defenderHealth: number;
  // Strength after terrain and river modifiers.
  attackerStrength: number;
  defenderStrength: number;
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
}

interface Combatant {
  unit: Unit;
  health: number;
  strength: number;
  damage: { min: number; max: number };
}

// Matches UnitDisplayInfo's WINDOW_WIDTH and WINDOW_HEIGHT - this window stacks right on top of it.
const WINDOW_WIDTH = 300;
const UNIT_INFO_HEIGHT = 170;
const WINDOW_HEIGHT = 172;
const PADDING = 10;
// Each side's unit, ring, strength and health bar are centered in a column this wide, leaving the
// middle to the outcome.
const SIDE_COLUMN_WIDTH = 96;
const UNIT_SIZE = 40;
const CIV_ICON_SIZE = 20;
const RING_RADIUS = 15;
const OUTCOME_ICON_SIZE = 32;
const STRENGTH_ICON_SIZE = 18;
const BAR_WIDTH = 92;
const BAR_HEIGHT = 18;
const TITLE_FONT = "20px serif";
const FONT = "16px serif";
const SMALL_FONT = "14px serif";

/**
 * Attacker on the left, defender on the right, the likely outcome between them. Each side shows its
 * unit, its civ icon in a ring of its current health like the one over units on the map, its strength,
 * and old_java's health bar for where its health ends up: green is kept on any roll, yellow is what
 * the roll decides, red is lost either way.
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

    this.addCenteredLabel("Combat Preview", this.x + this.width / 2, this.y + 6, TITLE_FONT);

    const leftCenterX = this.x + PADDING + SIDE_COLUMN_WIDTH / 2;
    const rightCenterX = this.x + this.width - PADDING - SIDE_COLUMN_WIDTH / 2;
    this.addCombatant(
      {
        unit: attacker,
        health: preview.attackerHealth,
        strength: preview.attackerStrength,
        damage: preview.attackerDamage
      },
      leftCenterX,
      false
    );
    this.addCombatant(
      {
        unit: defender,
        health: preview.defenderHealth,
        strength: preview.defenderStrength,
        damage: preview.defenderDamage
      },
      rightCenterX,
      true
    );

    this.addOutcome(preview.outcome, this.x + this.width / 2);

    this.addCenteredLabel(
      "Yellow health depends on the roll",
      this.x + this.width / 2,
      this.y + this.height - 22,
      SMALL_FONT
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

  // Unit and ring on one row (mirrored for the defender, so both units face the middle), then name,
  // strength and health bar underneath.
  private addCombatant(combatant: Combatant, centerX: number, mirrored: boolean) {
    const rowCenterY = this.y + 52;
    const rowWidth = UNIT_SIZE + 6 + RING_RADIUS * 2;
    const rowX = centerX - rowWidth / 2;
    const unitX = mirrored ? rowX + rowWidth - UNIT_SIZE : rowX;
    const ringCenterX = mirrored ? rowX + RING_RADIUS : rowX + rowWidth - RING_RADIUS;

    this.addUnitSprite(combatant.unit, unitX, rowCenterY);
    this.addRing(combatant.unit, ringCenterX, rowCenterY, combatant.health);
    this.addCenteredLabel(Strings.capitalizeWords(combatant.unit.getName()), centerX, this.y + 76, FONT);
    this.addStrength(combatant.strength, centerX, this.y + 97);
    this.addHealthBar(combatant.health, combatant.damage, centerX - BAR_WIDTH / 2, this.y + 120);
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

  private addRing(unit: Unit, centerX: number, centerY: number, health: number) {
    this.rings.push({ centerX, centerY, health });

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

  // Crossed swords, then the strength after modifiers (e.g. 10 for a Warrior on a hill).
  private addStrength(strength: number, centerX: number, y: number) {
    const text = `${Math.round(strength * 10) / 10}`;
    const label = new Label({ text, font: FONT, fontColor: "white" });
    label.conformSize().then(() => {
      const width = STRENGTH_ICON_SIZE + 4 + label.getWidth();
      const x = centerX - width / 2;
      this.addActor(
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: SpriteRegion.ICON_COMBAT,
          x,
          y,
          width: STRENGTH_ICON_SIZE,
          height: STRENGTH_ICON_SIZE
        })
      );
      label.setPosition(x + STRENGTH_ICON_SIZE + 4, y + (STRENGTH_ICON_SIZE - label.getHeight()) / 2);
      this.addActor(label);
    });
  }

  // old_java's Healthbar, red under green, with a yellow band between the worst and best roll and the
  // range written on top (e.g. "64-76").
  private addHealthBar(health: number, damage: { min: number; max: number }, x: number, y: number) {
    const worst = Math.max(0, health - damage.max);
    const best = Math.max(0, health - damage.min);
    const width = (value: number) => (Math.min(Unit.MAX_HEALTH, value) / Unit.MAX_HEALTH) * BAR_WIDTH;

    this.addActor(new Actor({ color: "red", x, y, width: BAR_WIDTH, height: BAR_HEIGHT }));
    if (best > 0) this.addActor(new Actor({ color: "gold", x, y, width: width(best), height: BAR_HEIGHT }));
    if (worst > 0) this.addActor(new Actor({ color: "limegreen", x, y, width: width(worst), height: BAR_HEIGHT }));

    const text = worst === best ? `${best} HP` : `${worst}-${best} HP`;
    const label = new Label({ text, font: SMALL_FONT, fontColor: "white", shadowColor: "black", shadowBlur: 3 });
    label.conformSize().then(() => {
      label.setPosition(x + (BAR_WIDTH - label.getWidth()) / 2, y + (BAR_HEIGHT - label.getHeight()) / 2);
      this.addActor(label);
    });
  }

  // Icon on the row with the units, the outcome's words stacked under it so they fit the narrow middle.
  private addOutcome(outcome: string, centerX: number) {
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
        y: this.y + 52 - OUTCOME_ICON_SIZE / 2,
        width: OUTCOME_ICON_SIZE,
        height: OUTCOME_ICON_SIZE
      })
    );
    outcome.split(" ").forEach((word, line) => {
      this.addCenteredLabel(word, centerX, this.y + 76 + line * 18, FONT, color);
    });
  }

  // The unit's current health, clockwise from 12 o'clock, as over units on the map.
  private drawRing(ring: HealthRing, canvasContext: CanvasRenderingContext2D) {
    const game = Game.getInstance();
    const top = -Math.PI / 2;
    const healthAngle = (Math.max(0, Math.min(Unit.MAX_HEALTH, ring.health)) / Unit.MAX_HEALTH) * Math.PI * 2;
    const sector = {
      x: ring.centerX,
      y: ring.centerY,
      radius: RING_RADIUS,
      canvasContext,
      cameraApplies: false
    };

    game.drawCircleSector({ ...sector, startAngle: 0, endAngle: Math.PI * 2, color: "red" });
    if (healthAngle > 0) {
      game.drawCircleSector({ ...sector, startAngle: top, endAngle: top + healthAngle, color: "lime" });
    }
  }

  private addCenteredLabel(text: string, centerX: number, y: number, font: string, fontColor = "white") {
    const label = new Label({ text, font, fontColor });
    label.conformSize().then(() => {
      label.setPosition(centerX - label.getWidth() / 2, y);
      this.addActor(label);
    });
  }
}
