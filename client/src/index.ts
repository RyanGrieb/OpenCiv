import { assetList } from "./assets";
import { Game } from "./game";
import { JoinGameScene } from "./scene/type/joinGameScene";
import { MainMenuScene } from "./scene/type/mainMenuScene";
import { MPOptionsScene } from "./scene/type/mpOptionsScene";

Game.init({ assetList: assetList, canvasColor: "gray" }, () => {
  Game.addScene("main_menu", new MainMenuScene());
  Game.addScene("mp_options", new MPOptionsScene());
  Game.addScene("join_game", new JoinGameScene());
  Game.setScene("main_menu");
});
