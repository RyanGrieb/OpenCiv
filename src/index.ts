import { assetList } from "./assets";
import { Game } from "./game";
import { LobbyScene } from "./scene/type/mainMenuScene";

Game.init({ assetList: assetList, canvasColor: "gray" }, () => {
  Game.addScene("lobby", new LobbyScene());
  Game.setScene("lobby");
});
