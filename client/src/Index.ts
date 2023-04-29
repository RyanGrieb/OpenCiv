import { assetList } from "./Assets";
import { Game } from "./Game";
import { InGameScene } from "./scene/type/InGameScene";
import { JoinGameScene } from "./scene/type/JoinGameScene";
import { LoadingScene } from "./scene/type/LoadingScene";
import { LobbyScene } from "./scene/type/LobbyScene";
import { MainMenuScene } from "./scene/type/MainMenuScene";

Game.init({ assetList: assetList, canvasColor: "gray" }, () => {
  Game.addScene("main_menu", new MainMenuScene());
  Game.addScene("join_game", new JoinGameScene());
  Game.addScene("lobby", new LobbyScene());
  Game.addScene("in_game", new InGameScene());
  Game.addScene("loading_scene", new LoadingScene());
  Game.setScene("main_menu");
});
