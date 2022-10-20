import { assetList } from "./assets";
import { Game } from "./game";
import { LobbyScene } from "./scene/type/lobbyScene";

Game.init({ assetList: assetList, canvasColor:"white" }, () => {
  Game.addScene("lobby", new LobbyScene());
  Game.setScene("lobby");
});
