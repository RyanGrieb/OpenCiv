import { Game } from "../../game";
import { Button } from "../../ui/button";
import { ListBox } from "../../ui/listbox";
import { Actor } from "../actor";
import { Scene } from "../scene";
import { SceneBackground } from "../sceneBackground";
export class JoinGameScene extends Scene {
  public onInitialize(): void {
    super.onInitialize();
    this.addActor(SceneBackground.generateRandomGrassland());

    const serverList = new ListBox({
      x: 25,
      y: 25,
      width: Game.getWidth() / 2 - 50,
      height: Game.getHeight() - 50,
      rowHeight: 50,
    });
    const testNames = ["server1", "test", "foo"];
    this.addActor(serverList);

    this.addActor(
      new Actor({
        x: Game.getWidth() / 2 + Game.getWidth() / 4 -  Math.min(Game.getWidth() / 2 - 100, 600) / 2,
        y: 50,
        width: Math.min(Game.getWidth() / 2 - 100, 600),
        height: 400, //FIXME: Dynamic y
        color: "black",
      })
    );

    this.addActor(
      new Button({
        text: "Direct Connect",
        x: Game.getWidth() / 2 + Game.getWidth() / 4 - 242 / 2,
        y: Game.getHeight() / 1.85 + 68,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          Game.setScene("mp_options");
        },
      })
    );

    this.addActor(
      new Button({
        text: "Back",
        x: Game.getWidth() / 2 + Game.getWidth() / 4 - 242 / 2,
        y: Game.getHeight() / 1.85 + 136,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          Game.setScene("mp_options");
        },
      })
    );
  }
}
