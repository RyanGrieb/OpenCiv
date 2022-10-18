import * as ex from "excalibur";

class GameScene extends ex.Scene {
  protected game: ex.Engine;

  constructor(game: ex.Engine) {
    super();
    this.game = game;
  }
}

export { GameScene };
