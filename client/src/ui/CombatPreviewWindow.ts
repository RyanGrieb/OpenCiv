import { ClientSettings } from "../ClientSettings";
import { GameImage, resolveSpriteRegion } from "../Assets";
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
  attackerDamage: { min: number; expected: number; max: number };
  defenderDamage: { min: number; expected: number; max: number };
}

const WINDOW_WIDTH = 330;
const WINDOW_HEIGHT = 150;
const PADDING = 10;
const ICON_SIZE = 24;
const BAR_WIDTH = 120;
const BAR_HEIGHT = 24;
const BAR_FONT = "18px serif";
// Matches UnitDisplayInfo's WINDOW_HEIGHT - this window stacks right on top of it.
const UNIT_INFO_HEIGHT = 170;

/**
 * Mirrors old_java's UnitCombatWindow: "Combat Preview", then each side's civ icon, name and a health
 * bar showing where its health should end up after the attack (the average roll), with "Vs." between.
 */
export class CombatPreviewWindow extends ActorGroup {
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

    this.addCenteredLabel("Combat Preview", this.y + PADDING);
    this.addCombatant(attacker, preview.attackerHealth - preview.attackerDamage.expected, this.y + PADDING + 36);
    this.addLabel("Vs.", this.x + PADDING + ICON_SIZE + 24, this.y + PADDING + 66);
    this.addCombatant(defender, preview.defenderHealth - preview.defenderDamage.expected, this.y + PADDING + 98);
  }

  private addCombatant(unit: Unit, healthAfter: number, y: number) {
    const iconRegion = resolveSpriteRegion(unit.getPlayer()?.getCivilizationData()?.icon_name);
    if (iconRegion !== undefined) {
      this.addActor(
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: iconRegion,
          x: this.x + PADDING,
          y,
          width: ICON_SIZE,
          height: ICON_SIZE
        })
      );
    }

    this.addLabel(Strings.capitalizeWords(unit.getName()), this.x + PADDING + ICON_SIZE + 8, y);

    // Red behind, green over it for the health that's left - old_java's Healthbar.
    const barX = this.x + this.width - PADDING - BAR_WIDTH;
    const fraction = Math.max(0, Math.min(Unit.MAX_HEALTH, healthAfter)) / Unit.MAX_HEALTH;
    this.addActor(new Actor({ color: "red", x: barX, y, width: BAR_WIDTH, height: BAR_HEIGHT }));
    if (fraction > 0) {
      this.addActor(new Actor({ color: "limegreen", x: barX, y, width: BAR_WIDTH * fraction, height: BAR_HEIGHT }));
    }

    const percent = new Label({ text: `${Math.round(fraction * 100)}%`, font: BAR_FONT, fontColor: "white" });
    percent.conformSize().then(() => {
      percent.setPosition(barX + (BAR_WIDTH - percent.getWidth()) / 2, y + (BAR_HEIGHT - percent.getHeight()) / 2);
      this.addActor(percent);
    });
  }

  private addLabel(text: string, x: number, y: number) {
    const label = new Label({ text, font: UITheme.FONT, fontColor: "white" });
    label.conformSize().then(() => {
      label.setPosition(x, y);
      this.addActor(label);
    });
  }

  private addCenteredLabel(text: string, y: number) {
    const label = new Label({ text, font: UITheme.FONT, fontColor: "white" });
    label.conformSize().then(() => {
      label.setPosition(this.x + (this.width - label.getWidth()) / 2, y);
      this.addActor(label);
    });
  }
}
