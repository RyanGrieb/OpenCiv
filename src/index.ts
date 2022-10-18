import * as ex from "excalibur";
import { loader } from "./resources";
//import { Loader } from './resources'
import { Button } from "./button";
import { MainMenu } from "./scenes/mainmenu";

//TODO: Update game size when the browser resizes...
const game = new ex.Engine({
  width: window.innerWidth,
  height: window.innerHeight,
  suppressHiDPIScaling: true,
});

game.backgroundColor = ex.Color.fromHex("#222222")

game.add("mainMenu", new MainMenu());
game.goToScene("mainMenu");
game.start(loader);
