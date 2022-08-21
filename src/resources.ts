import * as ex from 'excalibur'

const spritesheetFile = require('../assets/spritesheet.png')
const buttonFile = require('../assets/ui_button.png')
const buttonHoveredFile = require('../assets/ui_button_hovered.png')

const Resources = {
    spritesheet: new ex.ImageSource(spritesheetFile),
	button: new ex.ImageSource(buttonFile),
	buttonHovered: new ex.ImageSource(buttonHoveredFile)
}

const loader = new ex.Loader()

const spritesheet = ex.SpriteSheet.fromImageSource({
    image:Resources.spritesheet, 
    grid: { 
        columns: 5,
        rows: 5, 
        spriteWidth: 32,
        spriteHeight: 32
    }
})

for (const res in Resources) {
    loader.addResource((Resources as any)[res])
}

export { Resources, loader, spritesheet }
