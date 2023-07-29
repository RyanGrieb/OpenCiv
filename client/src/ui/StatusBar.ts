import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { NetworkEvents } from "../network/Client";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Label } from "./Label";

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
      width: Game.getWidth(),
      height: 21,
      cameraApplies: false,
    });

    this.generateActors();
    // Wait until this async method is done

    NetworkEvents.on({
      eventName: "newTurn",
      parentObject: this,
      callback: (data) => {
        this.updateCurrentTurnLabel(data);
      },
    });

    NetworkEvents.on({
      eventName: "turnTimeDecrement",
      parentObject: this,
      callback: (data) => {
        this.updateCurrentTurnLabel(data);
      },
    });
  }

  private updateCurrentTurnLabel(data: JSON) {
    const text = `Turns: ${data["turn"]} (${data["turnTime"]}s)`;

    if (!this.currentTurnLabel) {
      this.currentTurnText = text;
    } else {
      this.currentTurnLabel.setText(text);
      this.currentTurnLabel.conformSize().then(() => {
        this.currentTurnLabel.setPosition(
          Game.getWidth() - this.currentTurnLabel.getWidth() - 1,
          3
        );
      });
    }
  }

  private async generateActors() {
    this.statusBarActor = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.UI_STATUSBAR,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    });
    this.addActor(this.statusBarActor);

    //Science Information
    this.scienceDescLabel = new Label({
      text: "Science:",
      font: "16px serif",
      fontColor: "white",
    });
    await this.scienceDescLabel.conformSize();
    this.scienceDescLabel.setPosition(this.x + 1, 3);
    this.addActor(this.scienceDescLabel);

    this.scienceIcon = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.SCIENCE_ICON,
      x: this.scienceDescLabel.getX() + this.scienceDescLabel.getWidth(),
      y: -6,
      width: 32,
      height: 32,
    });

    this.addActor(this.scienceIcon);

    this.scienceLabel = new Label({
      text: "+0",
      font: "16px serif",
      fontColor: "white",
    });
    await this.scienceLabel.conformSize();
    this.scienceLabel.setPosition(
      this.scienceIcon.getX() + this.scienceIcon.getWidth() - 6,
      3
    );
    this.addActor(this.scienceLabel);

    // Culture information
    this.cultureDescLabel = new Label({
      text: "Culture:",
      font: "16px serif",
      fontColor: "white",
    });
    await this.cultureDescLabel.conformSize();
    this.cultureDescLabel.setPosition(
      this.scienceLabel.getX() + this.scienceLabel.getWidth() + 10,
      3
    );
    this.addActor(this.cultureDescLabel);

    this.cultureIcon = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.CULTURE_ICON,
      x: this.cultureDescLabel.getX() + this.cultureDescLabel.getWidth(),
      y: -6,
      width: 32,
      height: 32,
    });

    this.addActor(this.cultureIcon);

    this.cultureLabel = new Label({
      text: "+0",
      font: "16px serif",
      fontColor: "white",
    });
    await this.cultureLabel.conformSize();
    this.cultureLabel.setPosition(
      this.cultureIcon.getX() + this.cultureIcon.getWidth() - 6,
      3
    );
    this.addActor(this.cultureLabel);

    //Gold information
    this.goldDescLabel = new Label({
      text: "Gold:",
      font: "16px serif",
      fontColor: "white",
    });
    await this.goldDescLabel.conformSize();
    this.goldDescLabel.setPosition(
      this.cultureLabel.getX() + this.cultureLabel.getWidth() + 10,
      3
    );
    this.addActor(this.goldDescLabel);

    this.goldIcon = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.GOLD_ICON,
      x: this.goldDescLabel.getX() + this.goldDescLabel.getWidth(),
      y: -6,
      width: 32,
      height: 32,
    });

    this.addActor(this.goldIcon);

    this.goldLabel = new Label({
      text: "+0",
      font: "16px serif",
      fontColor: "white",
    });
    await this.goldLabel.conformSize();
    this.goldLabel.setPosition(
      this.goldIcon.getX() + this.goldIcon.getWidth() - 6,
      3
    );
    this.addActor(this.goldLabel);

    //Faith information

    this.faithDescLabel = new Label({
      text: "Faith:",
      font: "16px serif",
      fontColor: "white",
    });
    await this.faithDescLabel.conformSize();
    this.faithDescLabel.setPosition(
      this.goldLabel.getX() + this.goldLabel.getWidth() + 10,
      3
    );
    this.addActor(this.faithDescLabel);

    this.faithIcon = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.FAITH_ICON,
      x: this.faithDescLabel.getX() + this.faithDescLabel.getWidth(),
      y: -6,
      width: 32,
      height: 32,
    });

    this.addActor(this.faithIcon);

    this.faithLabel = new Label({
      text: "+0",
      font: "16px serif",
      fontColor: "white",
    });
    await this.faithLabel.conformSize();
    this.faithLabel.setPosition(
      this.faithIcon.getX() + this.faithIcon.getWidth() - 6,
      3
    );
    this.addActor(this.faithLabel);

    //Trade information
    this.tradeDescLabel = new Label({
      text: "Trade:",
      font: "16px serif",
      fontColor: "white",
    });
    await this.tradeDescLabel.conformSize();
    this.tradeDescLabel.setPosition(
      this.faithLabel.getX() + this.faithLabel.getWidth() + 10,
      3
    );
    this.addActor(this.tradeDescLabel);

    this.tradeIcon = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.TRADE_ICON,
      x: this.tradeDescLabel.getX() + this.tradeDescLabel.getWidth() + 10,
      y: 2,
      width: 16,
      height: 16,
    });

    this.addActor(this.tradeIcon);

    this.tradeLabel = new Label({
      text: "0/0",
      font: "16px serif",
      fontColor: "white",
    });
    await this.tradeLabel.conformSize();
    this.tradeLabel.setPosition(
      this.tradeIcon.getX() + this.tradeIcon.getWidth() + 4,
      3
    );
    this.addActor(this.tradeLabel);

    // Current turn information
    this.currentTurnLabel = new Label({
      text: this.currentTurnText,
      font: "16px serif",
      fontColor: "white",
    });
    await this.currentTurnLabel.conformSize();
    this.currentTurnLabel.setPosition(
      Game.getWidth() - this.currentTurnLabel.getWidth() - 1,
      3
    );
    this.addActor(this.currentTurnLabel);
  }
}
