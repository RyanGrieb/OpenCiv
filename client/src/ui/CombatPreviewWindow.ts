import { ClientSettings } from "../ClientSettings";
import { GameImage } from "../Assets";
import { Game } from "../Game";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Strings } from "../util/Strings";
import { Label } from "./Label";
import { UITheme } from "./UITheme";

// Mirrors server/src/unit/Combat.ts's CombatModifier.
export interface CombatModifier {
  label: string;
  value: number;
}

// Server "combatPreview" payload, from Unit.getMeleePreview(). A fight against civilians only carries
// the target and outcome ("Capture" or "Destroy"); everything else is there when something defends.
export interface CombatPreviewEvent {
  attackerId: number;
  targetX: number;
  targetY: number;
  defenderName: string;
  outcome: string;
  attackerHealth?: number;
  defenderHealth?: number;
  attackerStrength?: number;
  defenderStrength?: number;
  attackerModifiers?: CombatModifier[];
  defenderModifiers?: CombatModifier[];
  attackerDamage?: { min: number; max: number };
  defenderDamage?: { min: number; max: number };
}

const WINDOW_WIDTH = 330;
const LINE_HEIGHT = 28;
const PADDING = 12;
// Matches UnitDisplayInfo's WINDOW_HEIGHT - this window stacks right on top of it.
const UNIT_INFO_HEIGHT = 170;

// Civ 5's pre-attack readout: shown while aiming a melee unit at an enemy, so the player knows what
// the attack will cost before committing to it. Sits on top of the selected unit's UnitDisplayInfo.
export class CombatPreviewWindow extends ActorGroup {
  constructor(attackerName: string, preview: CombatPreviewEvent) {
    const lines = CombatPreviewWindow.describe(attackerName, preview);
    const height = PADDING * 2 + LINE_HEIGHT * lines.length;

    super({
      x: Game.getInstance().getWidth() - WINDOW_WIDTH,
      y: Game.getInstance().getHeight() - UNIT_INFO_HEIGHT - height - 8,
      width: WINDOW_WIDTH,
      height,
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

    lines.forEach((line, index) => {
      const label = new Label({ text: line.text, font: UITheme.FONT, fontColor: line.color ?? "white" });
      label.conformSize().then(() => {
        const x = line.centered ? this.x + (this.width - label.getWidth()) / 2 : this.x + PADDING;
        label.setPosition(x, this.y + PADDING + LINE_HEIGHT * index);
        this.addActor(label);
      });
    });
  }

  private static describe(attackerName: string, preview: CombatPreviewEvent) {
    const lines: { text: string; color?: string; centered?: boolean }[] = [
      {
        text: `${Strings.capitalizeWords(attackerName)} vs ${Strings.capitalizeWords(preview.defenderName)}`,
        centered: true
      }
    ];

    if (preview.attackerStrength !== undefined) {
      const strength = (value: number) => (Math.round(value * 10) / 10).toString();
      const modifier = (m: CombatModifier) => `${m.label} ${m.value > 0 ? "+" : ""}${Math.round(m.value * 100)}%`;
      const afterHit = (health: number, damage: { min: number; max: number }) => {
        const low = Math.max(0, health - damage.max);
        const high = Math.max(0, health - damage.min);
        return low === high ? `${low}` : `${low}-${high}`;
      };

      lines.push({ text: `Strength: ${strength(preview.attackerStrength)} vs ${strength(preview.defenderStrength)}` });
      preview.attackerModifiers.forEach((m) => lines.push({ text: `  Ours: ${modifier(m)}`, color: "#d0d0d0" }));
      preview.defenderModifiers.forEach((m) => lines.push({ text: `  Theirs: ${modifier(m)}`, color: "#d0d0d0" }));
      lines.push({
        text: `Our HP: ${preview.attackerHealth} -> ${afterHit(preview.attackerHealth, preview.attackerDamage)}`
      });
      lines.push({
        text: `Their HP: ${preview.defenderHealth} -> ${afterHit(preview.defenderHealth, preview.defenderDamage)}`
      });
    }

    lines.push({ text: preview.outcome, color: CombatPreviewWindow.outcomeColor(preview.outcome), centered: true });
    return lines;
  }

  private static outcomeColor(outcome: string): string {
    if (outcome.includes("Victory") || outcome === "Capture" || outcome === "Destroy") return "lime";
    if (outcome.includes("Defeat")) return "#ff5a4a";
    return "yellow";
  }
}
