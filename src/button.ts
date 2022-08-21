import * as ex from 'excalibur'
import { Resources } from './resources'

class Button extends ex.Actor {

	private text;

	private defaultSprite: ex.Sprite;
	private hoveredSprite: ex.Sprite;

	constructor(x: number, y: number, w: number, h: number) {
		super({ x: x, y: y, width: w, height: h });


		//FIXME: Correct button sprite image

		let spriteWidth = this.width;
		let spriteHeight = this.height;

		this.defaultSprite = new ex.Sprite({
			image: Resources.button,
			destSize: {
				width: spriteWidth,
				height: spriteHeight,
			},
		})

		this.hoveredSprite = new ex.Sprite({
			image: Resources.buttonHovered,
			destSize: {
				width: spriteWidth,
				height: spriteHeight,
			},
		})

		//FIXME: Scale text to be inside button properly
		//FIXME: Load my custom font
		this.text = new ex.Text({
			text: 'Test',
			font: new ex.Font({
				family: 'impact',
				size: 24,
				unit: ex.FontUnit.Px
			})
		});

		

	}

	public onInitialize(engine: ex.Engine) {


		this.graphics.use(this.defaultSprite)
		this.graphics.add(this.text);

		this.on('pointerup', (event) => {
			console.log('Button click', event)
		})

		this.on('pointerenter', (event) => {
			this.graphics.use(this.hoveredSprite)
			this.graphics.add(this.text);

		})

		this.on('pointerleave', (event) => {
			this.graphics.use(this.defaultSprite)
			this.graphics.add(this.text);
		})
	}
}

export { Button }