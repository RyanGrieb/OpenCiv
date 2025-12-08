import { assetList } from "./Assets";
import { Game } from "./Game";
import { InGameScene } from "./scene/type/InGameScene";
import { JoinGameScene } from "./scene/type/JoinGameScene";
import { LoadingScene } from "./scene/type/LoadingScene";
import { LobbyScene } from "./scene/type/LobbyScene";
import { MainMenuScene } from "./scene/type/MainMenuScene";

Game.createInstance({ assetList: assetList, canvasColor: "gray" }, () => {
  Game.getInstance().addScene("main_menu", new MainMenuScene());
  Game.getInstance().addScene("join_game", new JoinGameScene());
  Game.getInstance().addScene("lobby", new LobbyScene());
  Game.getInstance().addScene("in_game", new InGameScene());
  Game.getInstance().addScene("loading_scene", new LoadingScene());
  Game.getInstance().setScene("main_menu");

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("test") === "true") {
    import("./testing/scenarios/CitySettlement.test").then(module => {
      setTimeout(() => {
        const runner = module.setupCitySettlementTest(Game.getInstance());
        runner.run();
      }, 1000);
    });
  }
});
