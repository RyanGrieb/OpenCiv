import { assetList } from "./assets";
import { Game } from "./game";
import { InGameScene } from "./scene/type/inGameScene";
import { JoinGameScene } from "./scene/type/joinGameScene";
import { LobbyScene } from "./scene/type/lobbyScene";
import { MainMenuScene } from "./scene/type/mainMenuScene";
import { MPOptionsScene } from "./scene/type/mpOptionsScene";

Game.init({ assetList: assetList, canvasColor: "gray" }, () => {
  Game.addScene("main_menu", new MainMenuScene());
  Game.addScene("mp_options", new MPOptionsScene());
  Game.addScene("join_game", new JoinGameScene());
  Game.addScene("lobby", new LobbyScene());
  Game.addScene("in_game", new InGameScene());
  Game.setScene("main_menu");
});
