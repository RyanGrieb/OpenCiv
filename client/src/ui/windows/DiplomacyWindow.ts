import { GameImage, resolveSpriteRegion, SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { AbstractPlayer } from "../../player/AbstractPlayer";
import { Relation } from "../../player/Diplomacy";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { InGameScene } from "../../scene/type/InGameScene";
import { Button, ButtonSize } from "../components/Button";
import { Label } from "../components/Label";
import { UITheme } from "../UITheme";

const WINDOW_WIDTH = 720;
const PADDING = 16;
const ROW_HEIGHT = 104;
const CIV_ICON_SIZE = 48;
const BUTTON_GAP = 8;
const TITLE_FONT = `bold ${UITheme.FONT_SIZE}px serif`;
const RULE_COLOR = "rgba(255, 255, 255, 0.3)";
const WAR_COLOR = "#ff6b6b";
const PEACE_COLOR = "#8fe388";

interface RowAction {
  label: string;
  onClicked: () => void;
}

/**
 * Old_java's Diplomacy Overview, with Civ 5's war and peace: one row per civilization met, saying
 * whether we're at war and offering whatever can be done about it - declare war, offer peace, or
 * answer an offer. The server decides all of it (see server PlayerDiplomacy); the window is rebuilt
 * from each "diplomacyUpdate" it sends.
 */
export class DiplomacyWindow extends ActorGroup {
  private onClose: () => void;
  private rowActions: Map<string, Button[]>;
  private built = false;
  // Updates can arrive while a build is still measuring text; only the latest one is shown.
  private buildCount = 0;

  constructor(options: { onClose: () => void }) {
    super({ x: 0, y: 0, z: 7, width: WINDOW_WIDTH, height: 0, cameraApplies: false });

    this.onClose = options.onClose;
    this.rowActions = new Map();

    NetworkEvents.on({
      eventName: "diplomacyUpdate",
      parentObject: this,
      // After ClientPlayer's own listener has stored the new relations.
      callback: () => setTimeout(() => this.build())
    });

    this.build();
  }

  public onDestroyed() {
    super.onDestroyed();
    NetworkEvents.removeCallbacksByParentObject(this);
  }

  // build() measures text asynchronously, so the window fills in a moment after it's created.
  public isBuilt(): boolean {
    return this.built;
  }

  // The buttons on a civilization's row, for the scenario test to press.
  public getRowButtons(playerName: string): Button[] {
    return this.rowActions.get(playerName) ?? [];
  }

  // Every Label in the window, for the scenario test to check what's shown.
  public getTexts(): string[] {
    return this.getActors()
      .filter((actor): actor is Label => actor instanceof Label)
      .map((label) => label.getText());
  }

  private static getStatus(relation: Relation): { text: string; color: string } {
    if (relation.atWar && relation.peaceOfferedToUs) return { text: "At war - they offer peace", color: WAR_COLOR };
    if (relation.atWar && relation.peaceOfferedByUs) return { text: "At war - peace offered", color: WAR_COLOR };
    if (relation.atWar && relation.turnsUntilPeace > 0) {
      return { text: `At war - can offer peace in ${relation.turnsUntilPeace} turns`, color: WAR_COLOR };
    }
    if (relation.atWar) return { text: "At war", color: WAR_COLOR };
    if (relation.treatyTurnsLeft > 0)
      return { text: `Peace treaty - ${relation.treatyTurnsLeft} turns`, color: PEACE_COLOR };

    return { text: "At peace", color: PEACE_COLOR };
  }

  private static getWarsText(relation: Relation): string {
    if (relation.atWarWith.length < 1) return "At war with no one";

    return `At war with: ${relation.atWarWith.join(", ")}`;
  }

  private static send(event: string, relation: Relation) {
    WebsocketClient.sendMessage({ event, playerName: relation.name });
  }

  private getActions(relation: Relation): RowAction[] {
    if (relation.atWar && relation.peaceOfferedToUs) {
      return [
        { label: "Accept Peace", onClicked: () => DiplomacyWindow.send("proposePeace", relation) },
        { label: "Refuse", onClicked: () => DiplomacyWindow.send("declinePeace", relation) }
      ];
    }
    if (relation.atWar && !relation.peaceOfferedByUs && relation.turnsUntilPeace === 0) {
      return [{ label: "Offer Peace", onClicked: () => DiplomacyWindow.send("proposePeace", relation) }];
    }
    if (!relation.atWar && relation.treatyTurnsLeft === 0) {
      return [{ label: "Declare War", onClicked: () => this.confirmWar(relation) }];
    }

    return [];
  }

  private confirmWar(relation: Relation) {
    const target = AbstractPlayer.getPlayerByName(relation.name);
    if (target) Game.getInstance().getCurrentSceneAs<InGameScene>().openDeclareWarPrompt(target);
  }

  // Lays everything out off to the side first, and only swaps it in once every label is measured,
  // so an update arriving mid-build can't leave two builds' rows on top of each other.
  private async build() {
    const buildId = ++this.buildCount;
    const relations = Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer().getRelations();
    const actors: Actor[] = [];
    const rowActions = new Map<string, Button[]>();

    const title = new Label({ text: "Diplomacy", font: TITLE_FONT, fontColor: "white" });
    await title.conformSize();

    const listTop = PADDING + title.getHeight() + 14;
    const height = listTop + Math.max(1, relations.length) * ROW_HEIGHT + PADDING;
    const x = Game.getInstance().getWidth() / 2 - WINDOW_WIDTH / 2;
    const y = Math.max(UITheme.STATUS_BAR_HEIGHT, Game.getInstance().getHeight() / 2 - height / 2);

    actors.push(
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x,
        y,
        width: WINDOW_WIDTH,
        height,
        nineSlice: true,
        cornerSize: 20
      })
    );

    title.setPosition(x + WINDOW_WIDTH / 2 - title.getWidth() / 2, y + PADDING);
    actors.push(title);

    actors.push(
      new Button({
        icon: SpriteRegion.ICON_CANCEL,
        iconOnly: true,
        size: ButtonSize.ICON_SMALL,
        x: x + WINDOW_WIDTH - PADDING - ButtonSize.ICON_SMALL.width,
        y: y + PADDING,
        onClicked: () => this.onClose()
      })
    );

    if (relations.length < 1) {
      const empty = new Label({
        text: "You have not met any other civilizations.",
        font: UITheme.FONT,
        fontColor: "lightgray"
      });
      await empty.conformSize();
      empty.setPosition(x + WINDOW_WIDTH / 2 - empty.getWidth() / 2, y + listTop + UITheme.centerTextY(ROW_HEIGHT));
      actors.push(empty);
    }

    for (let i = 0; i < relations.length; i++) {
      const row = await this.createRow(relations[i], x, y + listTop + i * ROW_HEIGHT);
      actors.push(...row.actors);
      rowActions.set(relations[i].name, row.buttons);
    }

    if (buildId !== this.buildCount) return;

    for (const actor of [...this.getActors()]) this.removeActor(actor);
    this.setPosition(x, y);
    this.setSize(WINDOW_WIDTH, height);
    actors.forEach((actor) => this.addActor(actor));
    this.rowActions = rowActions;
    this.built = true;
  }

  private async createRow(
    relation: Relation,
    x: number,
    rowY: number
  ): Promise<{ actors: Actor[]; buttons: Button[] }> {
    const actors: Actor[] = [];

    actors.push(
      new Actor({
        color: RULE_COLOR,
        x: x + PADDING,
        y: rowY,
        width: WINDOW_WIDTH - PADDING * 2,
        height: 1,
        cameraApplies: false
      })
    );

    actors.push(
      new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: resolveSpriteRegion(relation.iconName) ?? SpriteRegion.ICON_UNKNOWN,
        x: x + PADDING,
        y: rowY + (ROW_HEIGHT - CIV_ICON_SIZE) / 2,
        width: CIV_ICON_SIZE,
        height: CIV_ICON_SIZE,
        cameraApplies: false
      })
    );

    const textX = x + PADDING + CIV_ICON_SIZE + 12;
    const name = new Label({ text: relation.civName, font: TITLE_FONT, fontColor: "white" });
    await name.conformSize();
    name.setPosition(textX, rowY + 8);
    actors.push(name);

    const status = DiplomacyWindow.getStatus(relation);
    const statusLabel = new Label({ text: status.text, font: UITheme.FONT, fontColor: status.color });
    await statusLabel.conformSize();
    statusLabel.setPosition(textX, name.getY() + name.getHeight() + 6);
    actors.push(statusLabel);

    // Who else they're fighting, so the player can see every war they know of. "?" is a civilization
    // they haven't met - the server decides what this player may know.
    const warsLabel = new Label({
      text: DiplomacyWindow.getWarsText(relation),
      font: UITheme.FONT,
      fontColor: "lightgray"
    });
    await warsLabel.conformSize();
    warsLabel.setPosition(textX, statusLabel.getY() + statusLabel.getHeight() + 6);
    actors.push(warsLabel);

    const buttons: Button[] = [];
    let buttonX = x + WINDOW_WIDTH - PADDING;
    for (const action of this.getActions(relation).reverse()) {
      buttonX -= ButtonSize.SMALL.width;
      buttons.unshift(
        new Button({
          text: action.label,
          x: buttonX,
          y: rowY + (ROW_HEIGHT - ButtonSize.SMALL.height) / 2,
          size: ButtonSize.SMALL,
          fontColor: "white",
          onClicked: action.onClicked
        })
      );
      buttonX -= BUTTON_GAP;
    }
    actors.push(...buttons);

    return { actors, buttons };
  }
}
