import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { NetworkEvents } from "../network/Client";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { InGameScene } from "../scene/type/InGameScene";
import { Strings } from "../util/Strings";
import { Label } from "./Label";
import { UITheme } from "./UITheme";

interface TurnTimeEvent {
  turn: number;
  turnTime: number;
}

export class StatusBar extends ActorGroup {
  private statusBarActor: Actor;

  private currentTurnText: string; //when currentTurnLabel may not be initalized yet
  private currentTurnLabel: Label;

  private scienceDescLabel: Label;
  private scienceIcon: Actor;
  private scienceLabel: Label;

  private cultureDescLabel: Label;
  private cultureIcon: Actor;
  private cultureLabel: Label;

  private goldDescLabel: Label;
  private goldIcon: Actor;
  private goldLabel: Label;

  private faithDescLabel: Label;
  private faithIcon: Actor;
  private faithLabel: Label;

  private tradeDescLabel: Label;
  private tradeIcon: Actor;
  private tradeLabel: Label;

  constructor() {
    super({
      x: 0,
      y: 0,
      z: 5,
      width: Game.getInstance().getWidth(),
      height: UITheme.STATUS_BAR_HEIGHT,
      cameraApplies: false
    });

    this.generateActors();
    // Wait until this async method is done

    NetworkEvents.on<TurnTimeEvent>({
      eventName: "newTurn",
      parentObject: this,
      callback: (data) => {
        this.updateCurrentTurnLabel(data);
      }
    });

    NetworkEvents.on<TurnTimeEvent>({
      eventName: "turnTimeDecrement",
      parentObject: this,
      callback: (data) => {
        this.updateCurrentTurnLabel(data);
      }
    });

    NetworkEvents.on({
      eventName: "updateTotalStats",
      parentObject: this,
      callback: () => {
        this.updateStatLabels();
      }
    });
  }

  private updateCurrentTurnLabel(data: TurnTimeEvent) {
    const text = `Turns: ${data.turn} (${data.turnTime}s)`;

    if (!this.currentTurnLabel) {
      this.currentTurnText = text;
    } else {
      this.currentTurnLabel.setText(text);
      this.currentTurnLabel.conformSize().then(() => {
        this.currentTurnLabel.setPosition(Game.getInstance().getWidth() - this.currentTurnLabel.getWidth() - 1, 8);
      });
    }
  }

  private async generateActors() {
    this.statusBarActor = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.UI_STATUSBAR,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    });
    this.addActor(this.statusBarActor);

    //Science Information
    this.scienceDescLabel = new Label({
      text: "Science:",
      font: UITheme.FONT,
      fontColor: "white"
    });
    await this.scienceDescLabel.conformSize();
    this.scienceDescLabel.setPosition(this.x + 1, 8);
    this.addActor(this.scienceDescLabel);

    this.scienceIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_SCIENCE,
      x: this.scienceDescLabel.getX() + this.scienceDescLabel.getWidth(),
      y: 0,
      width: UITheme.ICON_SIZE,
      height: UITheme.ICON_SIZE
    });

    this.addActor(this.scienceIcon);

    this.scienceLabel = new Label({
      text: "+0",
      font: UITheme.FONT,
      fontColor: "white"
    });
    await this.scienceLabel.conformSize();
    this.scienceLabel.setPosition(this.scienceIcon.getX() + this.scienceIcon.getWidth() - 8, 8);
    this.addActor(this.scienceLabel);

    // Culture information
    this.cultureDescLabel = new Label({
      text: "Culture:",
      font: UITheme.FONT,
      fontColor: "white"
    });
    await this.cultureDescLabel.conformSize();
    this.cultureDescLabel.setPosition(this.scienceLabel.getX() + this.scienceLabel.getWidth() + 10, 8);
    this.addActor(this.cultureDescLabel);

    this.cultureIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_CULTURE,
      x: this.cultureDescLabel.getX() + this.cultureDescLabel.getWidth(),
      y: 0,
      width: UITheme.ICON_SIZE,
      height: UITheme.ICON_SIZE
    });

    this.addActor(this.cultureIcon);

    this.cultureLabel = new Label({
      text: "+0",
      font: UITheme.FONT,
      fontColor: "white"
    });
    await this.cultureLabel.conformSize();
    this.cultureLabel.setPosition(this.cultureIcon.getX() + this.cultureIcon.getWidth() - 8, 8);
    this.addActor(this.cultureLabel);

    //Gold information
    this.goldDescLabel = new Label({
      text: "Gold:",
      font: UITheme.FONT,
      fontColor: "white"
    });
    await this.goldDescLabel.conformSize();
    this.goldDescLabel.setPosition(this.cultureLabel.getX() + this.cultureLabel.getWidth() + 10, 8);
    this.addActor(this.goldDescLabel);

    this.goldIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_GOLD,
      x: this.goldDescLabel.getX() + this.goldDescLabel.getWidth(),
      y: 0,
      width: UITheme.ICON_SIZE,
      height: UITheme.ICON_SIZE
    });

    this.addActor(this.goldIcon);

    this.goldLabel = new Label({
      text: "+0",
      font: UITheme.FONT,
      fontColor: "white"
    });
    await this.goldLabel.conformSize();
    this.goldLabel.setPosition(this.goldIcon.getX() + this.goldIcon.getWidth() - 8, 8);
    this.addActor(this.goldLabel);

    //Faith information

    this.faithDescLabel = new Label({
      text: "Faith:",
      font: UITheme.FONT,
      fontColor: "white"
    });
    await this.faithDescLabel.conformSize();
    this.faithDescLabel.setPosition(this.goldLabel.getX() + this.goldLabel.getWidth() + 10, 8);
    this.addActor(this.faithDescLabel);

    this.faithIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_FAITH,
      x: this.faithDescLabel.getX() + this.faithDescLabel.getWidth(),
      y: 0,
      width: UITheme.ICON_SIZE,
      height: UITheme.ICON_SIZE
    });

    this.addActor(this.faithIcon);

    this.faithLabel = new Label({
      text: "+0",
      font: UITheme.FONT,
      fontColor: "white"
    });
    await this.faithLabel.conformSize();
    this.faithLabel.setPosition(this.faithIcon.getX() + this.faithIcon.getWidth() - 8, 8);
    this.addActor(this.faithLabel);

    //Trade information
    this.tradeDescLabel = new Label({
      text: "Trade:",
      font: UITheme.FONT,
      fontColor: "white"
    });
    await this.tradeDescLabel.conformSize();
    this.tradeDescLabel.setPosition(this.faithLabel.getX() + this.faithLabel.getWidth() + 10, 8);
    this.addActor(this.tradeDescLabel);

    this.tradeIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_TRADE,
      x: this.tradeDescLabel.getX() + this.tradeDescLabel.getWidth(),
      y: 0,
      width: UITheme.ICON_SIZE,
      height: UITheme.ICON_SIZE
    });

    this.addActor(this.tradeIcon);

    this.tradeLabel = new Label({
      text: "0/0",
      font: UITheme.FONT,
      fontColor: "white"
    });
    await this.tradeLabel.conformSize();
    this.tradeLabel.setPosition(this.tradeIcon.getX() + this.tradeIcon.getWidth() - 8, 8);
    this.addActor(this.tradeLabel);

    // Current turn information
    this.currentTurnLabel = new Label({
      text: this.currentTurnText,
      font: UITheme.FONT,
      fontColor: "white"
    });
    await this.currentTurnLabel.conformSize();
    this.currentTurnLabel.setPosition(Game.getInstance().getWidth() - this.currentTurnLabel.getWidth() - 1, 8);
    this.addActor(this.currentTurnLabel);

    // Covers totals that already arrived (via the initial requestTotalStats) before
    // these labels finished being built.
    this.updateStatLabels();
  }

  // Re-flows every label after the changed one, since a wider/narrower number
  // shifts everything to its right in this left-to-right layout.
  private async updateStatLabels() {
    if (!this.scienceLabel) return;

    const clientPlayer = Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer();

    this.scienceLabel.setText(Strings.convertToStatUnit(clientPlayer.getTotalStat("science")));
    await this.scienceLabel.conformSize();
    this.scienceLabel.setPosition(this.scienceIcon.getX() + this.scienceIcon.getWidth() - 8, 8);

    this.cultureDescLabel.setPosition(this.scienceLabel.getX() + this.scienceLabel.getWidth() + 10, 8);
    this.cultureIcon.setPosition(this.cultureDescLabel.getX() + this.cultureDescLabel.getWidth(), this.cultureIcon.getY());
    this.cultureLabel.setText(Strings.convertToStatUnit(clientPlayer.getTotalStat("culture")));
    await this.cultureLabel.conformSize();
    this.cultureLabel.setPosition(this.cultureIcon.getX() + this.cultureIcon.getWidth() - 8, 8);

    this.goldDescLabel.setPosition(this.cultureLabel.getX() + this.cultureLabel.getWidth() + 10, 8);
    this.goldIcon.setPosition(this.goldDescLabel.getX() + this.goldDescLabel.getWidth(), this.goldIcon.getY());
    const goldTotal = clientPlayer.getAccumulatedStat("gold");
    const goldRate = Strings.convertToStatUnit(clientPlayer.getTotalStat("gold"));
    this.goldLabel.setText(`${goldTotal} (${goldRate})`);
    await this.goldLabel.conformSize();
    this.goldLabel.setPosition(this.goldIcon.getX() + this.goldIcon.getWidth() - 8, 8);

    this.faithDescLabel.setPosition(this.goldLabel.getX() + this.goldLabel.getWidth() + 10, 8);
    this.faithIcon.setPosition(this.faithDescLabel.getX() + this.faithDescLabel.getWidth(), this.faithIcon.getY());
    this.faithLabel.setText(Strings.convertToStatUnit(clientPlayer.getTotalStat("faith")));
    await this.faithLabel.conformSize();
    this.faithLabel.setPosition(this.faithIcon.getX() + this.faithIcon.getWidth() - 8, 8);

    this.tradeDescLabel.setPosition(this.faithLabel.getX() + this.faithLabel.getWidth() + 10, 8);
    this.tradeIcon.setPosition(this.tradeDescLabel.getX() + this.tradeDescLabel.getWidth(), this.tradeIcon.getY());
    this.tradeLabel.setPosition(this.tradeIcon.getX() + this.tradeIcon.getWidth() - 8, 8);
  }
}
