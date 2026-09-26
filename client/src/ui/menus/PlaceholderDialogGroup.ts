import { GameImage } from "../../Assets";
import { Game } from "../../Game";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { Button, ButtonSize } from "../components/Button";
import { Label } from "../components/Label";

export interface PlaceholderDialogGroupOptions {
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  onClose: () => void;
}

// Empty dialog shell used for panels that don't have real content yet (e.g. Game Options, Scenarios).
export class PlaceholderDialogGroup extends ActorGroup {
  constructor(options: PlaceholderDialogGroupOptions) {
    super({
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height
    });

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

    const titleLabel = new Label({
      text: options.title,
      font: "20px serif",
      fontColor: "white"
    });
    this.addActor(titleLabel);
    titleLabel.conformSize().then(() => {
      titleLabel.setPosition(this.x + this.width / 2 - titleLabel.getWidth() / 2, this.y + 12);
    });

    this.addActor(
      new Button({
        text: "Back",
        x: this.x + this.width / 2 - ButtonSize.MEDIUM.width / 2,
        y: this.y + this.height - 60,
        size: ButtonSize.MEDIUM,
        fontColor: "white",
        onClicked: () => options.onClose()
      })
    );
  }
}
