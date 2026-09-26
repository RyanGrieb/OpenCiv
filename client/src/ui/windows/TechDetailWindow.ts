import { GameImage, resolveSpriteRegion, SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { InGameScene } from "../../scene/type/InGameScene";
import { Button, ButtonSize } from "../components/Button";
import { Label } from "../components/Label";
import { UITheme } from "../UITheme";

const WINDOW_WIDTH = 440;
const PADDING = 16;
const TECH_ICON_SIZE = 56;
const ITEM_ICON_SIZE = 28;
const ITEM_COLUMNS = 2;
const ITEM_ROW_GAP = 6;
const SECTION_GAP = 14;
const TITLE_FONT = `bold ${UITheme.FONT_SIZE}px serif`;
const SECTION_FONT = "bold 20px serif";
const GROUP_FONT = "italic 17px serif";
const BODY_FONT = "17px serif";
const SECTION_COLOR = "#f0c860";
const SECTION_RULE_COLOR = "rgba(240, 200, 96, 0.5)";
const FOOTER_RULE_COLOR = "rgba(255, 255, 255, 0.3)";
const LINK_COLOR = "#9fd3ff";

export interface UnlockData {
  name: string;
  asset_name?: string;
}

export interface TechDetailData {
  name: string;
  asset_name: string;
  cost: number;
  prerequisites: string[];
  description: string;
  notes: string[];
  unlocks: {
    units: UnlockData[];
    buildings: UnlockData[];
    wonders: UnlockData[];
    improvements: UnlockData[];
  };
}

// Detail popup opened by clicking a tech tile in ResearchTreeWindow. Laid out
// like the Civ5 wiki's tech sidebar - cost, Requires, Leads to, Enables (units,
// buildings, wonders, improvements) and Notes - above old_java PickResearchWindow's
// turns/status line and Research/Cancel action. Requires/Leads to entries are
// links that open that tech's own window in place of this one.
export class TechDetailWindow extends ActorGroup {
  private tech: TechDetailData;
  private allTechs: TechDetailData[];
  private onClose: () => void;
  private onOpenTech: (techName: string) => void;

  private statusLabel: Label;
  private actionButton: Button;
  private statusY: number;
  private actionY: number;
  private built = false;

  constructor(options: {
    tech: TechDetailData;
    allTechs: TechDetailData[];
    onClose: () => void;
    onOpenTech: (techName: string) => void;
  }) {
    super({ x: 0, y: 0, z: 7, width: WINDOW_WIDTH, height: 0, cameraApplies: false });

    this.tech = options.tech;
    this.allTechs = options.allTechs;
    this.onClose = options.onClose;
    this.onOpenTech = options.onOpenTech;

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

  public getTech(): TechDetailData {
    return this.tech;
  }

  // Every Label in the window, for the scenario test to check what's shown.
  public getTexts(): string[] {
    return this.getActors()
      .filter((actor): actor is Label => actor instanceof Label)
      .map((label) => label.getText());
  }

  // Everything is measured and positioned relative to the window's origin first,
  // since the window's height (and so its centered on-screen position) is only
  // known once every section has been laid out. place() then shifts it all.
  private async build() {
    const contentWidth = WINDOW_WIDTH - PADDING * 2;
    const placed: { actor: Actor; x: number; y: number }[] = [];
    const place = (actor: Actor, x: number, y: number) => placed.push({ actor, x, y });

    const measure = async (label: Label) => {
      await label.conformSize();
      return label;
    };

    // Header: icon on the left, name and cost beside it.
    place(this.createIcon(this.tech.asset_name, TECH_ICON_SIZE), PADDING, PADDING);
    const textX = PADDING + TECH_ICON_SIZE + 12;
    const title = await measure(new Label({ text: this.tech.name, font: TITLE_FONT, fontColor: "white" }));
    place(title, textX, PADDING + 2);

    const costY = PADDING + TECH_ICON_SIZE - 22;
    const costLabel = await measure(new Label({ text: `Cost ${this.tech.cost}`, font: BODY_FONT, fontColor: "white" }));
    place(costLabel, textX, costY + 2);
    place(this.createIcon("ICON_SCIENCE", 20), textX + costLabel.getWidth() + 6, costY);

    let y = PADDING + TECH_ICON_SIZE + 10;

    if (this.tech.description) {
      const description = await measure(
        new Label({ text: this.tech.description, font: GROUP_FONT, fontColor: "lightgray", maxWidth: contentWidth })
      );
      place(description, PADDING, y);
      // Wrapped lines draw a little taller than getWrappedText's per-word height estimate.
      y += description.getHeight() + 8;
    }

    const techItem = (name: string): UnlockData => ({
      name,
      asset_name: this.allTechs.find((tech) => tech.name === name)?.asset_name
    });
    const leadsTo = this.allTechs
      .filter((tech) => tech.prerequisites.includes(this.tech.name))
      .map((tech) => tech.name);

    const addSectionHeader = async (text: string) => {
      y += SECTION_GAP;
      const header = await measure(new Label({ text, font: SECTION_FONT, fontColor: SECTION_COLOR }));
      place(header, PADDING, y);
      y += header.getHeight() + 2;
      place(
        new Actor({ color: SECTION_RULE_COLOR, x: 0, y: 0, width: contentWidth, height: 1, cameraApplies: false }),
        PADDING,
        y
      );
      y += 6;
    };

    const addItems = async (items: UnlockData[], isTechLink: boolean) => {
      const columnWidth = contentWidth / ITEM_COLUMNS;
      for (let i = 0; i < items.length; i++) {
        const itemX = PADDING + (i % ITEM_COLUMNS) * columnWidth;
        const itemY = y + Math.floor(i / ITEM_COLUMNS) * (ITEM_ICON_SIZE + ITEM_ROW_GAP);
        place(this.createIcon(items[i].asset_name, ITEM_ICON_SIZE), itemX, itemY);

        const name = items[i].name;
        const label = await measure(
          new Label({
            text: name,
            font: BODY_FONT,
            fontColor: isTechLink ? LINK_COLOR : "white",
            onClick: isTechLink ? () => this.onOpenTech(name) : undefined
          })
        );
        place(label, itemX + ITEM_ICON_SIZE + 6, itemY + (ITEM_ICON_SIZE - label.getHeight()) / 2);
      }
      y += Math.ceil(items.length / ITEM_COLUMNS) * (ITEM_ICON_SIZE + ITEM_ROW_GAP);
    };

    const addPlainText = async (text: string, x: number, maxWidth: number) => {
      const label = await measure(new Label({ text, font: BODY_FONT, fontColor: "lightgray", maxWidth }));
      place(label, x, y);
      // getWrappedText's height is a per-word sum rather than a per-line one, so it can undercount wrapped lines a little.
      y += label.getHeight() + 4;
    };

    await addSectionHeader("Requires");
    if (this.tech.prerequisites.length > 0) {
      await addItems(this.tech.prerequisites.map(techItem), true);
    } else {
      await addPlainText("None", PADDING, contentWidth);
    }

    if (leadsTo.length > 0) {
      await addSectionHeader("Leads to");
      await addItems(leadsTo.map(techItem), true);
    }

    const enableGroups: [string, UnlockData[]][] = [
      ["Units", this.tech.unlocks?.units ?? []],
      ["Buildings", this.tech.unlocks?.buildings ?? []],
      ["Wonders", this.tech.unlocks?.wonders ?? []],
      ["Improvements", this.tech.unlocks?.improvements ?? []]
    ];
    const nonEmptyGroups = enableGroups.filter(([, items]) => items.length > 0);
    if (nonEmptyGroups.length > 0) {
      await addSectionHeader("Enables");
      for (const [groupName, items] of nonEmptyGroups) {
        const groupLabel = await measure(new Label({ text: groupName, font: GROUP_FONT, fontColor: "lightgray" }));
        place(groupLabel, PADDING, y);
        y += groupLabel.getHeight() + 4;
        await addItems(items, false);
      }
    }

    if (this.tech.notes?.length > 0) {
      await addSectionHeader("Notes");
      for (const note of this.tech.notes) {
        const bullet = await measure(new Label({ text: "•", font: BODY_FONT, fontColor: "lightgray" }));
        place(bullet, PADDING + 4, y);
        await addPlainText(note, PADDING + 20, contentWidth - 20);
      }
    }

    y += SECTION_GAP;
    place(
      new Actor({ color: FOOTER_RULE_COLOR, x: 0, y: 0, width: contentWidth, height: 1, cameraApplies: false }),
      PADDING,
      y
    );
    this.statusY = y + 10;
    this.actionY = this.statusY + UITheme.FONT_SIZE + 12;
    const height = this.actionY + ButtonSize.MEDIUM.height + PADDING;

    this.setSize(WINDOW_WIDTH, height);
    this.setPosition(
      Game.getInstance().getWidth() / 2 - this.width / 2,
      Math.max(UITheme.STATUS_BAR_HEIGHT, Game.getInstance().getHeight() / 2 - height / 2)
    );

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

    for (const { actor, x, y } of placed) {
      actor.setPosition(this.x + x, this.y + y);
      this.addActor(actor);
    }

    this.addActor(
      new Button({
        icon: SpriteRegion.ICON_CANCEL,
        iconOnly: true,
        size: ButtonSize.ICON_SMALL,
        x: this.x + this.width - PADDING - ButtonSize.ICON_SMALL.width,
        y: this.y + PADDING,
        onClicked: () => this.onClose()
      })
    );

    this.statusLabel = new Label({ text: "", font: UITheme.FONT, fontColor: "white" });
    this.addActor(this.statusLabel);

    this.refresh();
    this.built = true;

    NetworkEvents.on({
      eventName: "updateResearch",
      parentObject: this,
      callback: () => this.refresh()
    });

    NetworkEvents.on({
      eventName: "updateTotalStats",
      parentObject: this,
      callback: () => this.refresh()
    });
  }

  private createIcon(assetName: string | undefined, size: number): Actor {
    return new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: (assetName && resolveSpriteRegion(assetName)) || SpriteRegion.ICON_UNKNOWN,
      x: 0,
      y: 0,
      width: size,
      height: size,
      cameraApplies: false
    });
  }

  // Re-evaluated on every updateResearch push, so a tech completing (or another
  // tech being picked, replacing this one) while the window is open never leaves
  // a stale Research/Cancel action showing.
  private refresh() {
    const clientPlayer = Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer();
    const currentResearch = clientPlayer.getCurrentResearch();
    const isResearched = clientPlayer.hasResearchedTech(this.tech.name);
    const isCurrent = currentResearch?.techName === this.tech.name;
    const missingPrerequisites = this.tech.prerequisites.filter((prereq) => !clientPlayer.hasResearchedTech(prereq));
    const rate = clientPlayer.getTotalStat("science");

    let statusText: string;
    if (isResearched) {
      statusText = "Researched";
    } else if (missingPrerequisites.length > 0) {
      statusText = "Research the required techs first";
    } else if (rate <= 0) {
      statusText = "Never (0 Science)";
    } else if (isCurrent) {
      const turnsRemaining = Math.max(1, Math.ceil((currentResearch.cost - currentResearch.progress) / rate));
      statusText = `${turnsRemaining} Turns Remaining`;
    } else {
      statusText = `${Math.max(1, Math.ceil(this.tech.cost / rate))} Turns`;
    }

    this.statusLabel.setText(statusText);
    this.statusLabel.conformSize().then(() => {
      this.statusLabel.setPosition(this.x + this.width / 2 - this.statusLabel.getWidth() / 2, this.y + this.statusY);
    });

    if (this.actionButton) {
      this.removeActor(this.actionButton);
      this.actionButton = undefined;
    }

    if (isResearched || missingPrerequisites.length > 0) return;

    this.actionButton = new Button({
      text: isCurrent ? "Cancel" : "Research",
      x: this.x + this.width / 2 - ButtonSize.MEDIUM.width / 2,
      y: this.y + this.actionY,
      size: ButtonSize.MEDIUM,
      fontColor: "white",
      onClicked: () => {
        if (isCurrent) {
          WebsocketClient.sendMessage({ event: "cancelResearch" });
        } else {
          WebsocketClient.sendMessage({ event: "chooseResearch", techName: this.tech.name });
        }
        this.onClose();

        if (!isCurrent) {
          Game.getInstance().getCurrentSceneAs<InGameScene>().toggleResearchUI();
        }
      }
    });
    this.addActor(this.actionButton);
  }
}
