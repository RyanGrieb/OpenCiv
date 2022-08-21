import * as ex from 'excalibur'
import { loader } from './resources'
//import { Loader } from './resources'
import { Button } from './button'



//TODO: Update game size when the browser resizes...
const game = new ex.Engine({
	width: window.innerWidth,
	height: window.innerHeight,
	suppressHiDPIScaling: true,
})


const button = new Button(game.canvasWidth / 2 - 300 / 2, 300, 300, 60)


const rnd = new ex.Random()

// add player to the current scene
game.add(button)
game.start(loader)
