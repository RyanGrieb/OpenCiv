import { Engine, Actor, Color, Random } from 'excalibur'

const game = new Engine({
	width: 600,
	height: 600,
})

const player = new Actor({
	name: 'player', // optionally assign a name
	width: 50,
	height: 50,
	x: 300,
	y: 300,
	color: Color.Green
})


const rnd = new Random()

// move the player
player.vel.x = rnd.integer(-15, 15)
player.vel.y = rnd.integer(-15, 15)

// add player to the current scene
game.add(player)



game.start()
