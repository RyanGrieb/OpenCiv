import * as ex from "excalibur";
import { loader } from "./resources";
//import { Loader } from './resources'
import { Button } from "./ui/button";
import { MainMenu } from "./scenes/mainmenu";
import { InGame } from "./scenes/ingame";
import { MultiplayerOptions } from "./scenes/multiplayerOptions";
//TODO: Update game size when the browser resizes...
const game = new ex.Engine({
  width: window.innerWidth,
  height: window.innerHeight,
  suppressHiDPIScaling: true,
  displayMode: ex.DisplayMode.Fixed,
  antialiasing: false,
});

game.backgroundColor = ex.Color.fromHex("#222222");

game.add("mainmenu", new MainMenu(game));
game.add("multiplayeroptions", new MultiplayerOptions(game))
game.add("ingame", new InGame(game));
game.goToScene("mainmenu");
game.start(loader);
