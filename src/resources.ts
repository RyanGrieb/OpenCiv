import * as ex from "excalibur";

const spritesheetFile = require("../assets/spritesheet.png");
const fontFile = require("../assets/font.png");
const buttonFile = require("../assets/ui_button.png");
const buttonHoveredFile = require("../assets/ui_button_hovered.png");

const Resources = {
  spritesheet: new ex.ImageSource(spritesheetFile),
  button: new ex.ImageSource(buttonFile),
  buttonHovered: new ex.ImageSource(buttonHoveredFile),
  font: new ex.ImageSource(fontFile),
};

const loader = new ex.Loader();

const spritesheet = ex.SpriteSheet.fromImageSource({
  image: Resources.spritesheet,
  grid: {
    columns: 20,
    rows: 20,
    spriteWidth: 32,
    spriteHeight: 32,
  },
});

const fontSpritesheet = ex.SpriteSheet.fromImageSource({
  image: Resources.font,
  grid: {
    rows: 3,
    columns: 16,
    spriteWidth: 16,
    spriteHeight: 16,
  },
});

for (const res in Resources) {
  loader.addResource((Resources as any)[res]);
}

// Define any sprites or fonts that wont change below... (TODO: For sprites maybe make an enum?)

const spriteFont = new ex.SpriteFont({
  alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ,!'&.\"?-()+ ",
  caseInsensitive: true,
  spriteSheet: fontSpritesheet,
  spacing: -6,
  scale: ex.vec(1.5, 1.5),
});

export { Resources, loader, spritesheet, spriteFont };
