"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = void 0;
const actor_1 = require("../scene/actor");
const assets_1 = require("../assets");
class Button extends actor_1.Actor {
    constructor(options) {
        super({
            spritesheet: assets_1.SpriteSheet.BUTTON,
            x: options.x,
            y: options.y,
            width: options.width,
            height: options.height,
        });
        this.callbackFunction = options.onClicked;
        this.on("mouse_enter", () => {
            //console.log("Mouse entered button actor");
            this.setSpritesheet(assets_1.SpriteSheet.BUTTON_HOVERED);
        });
        this.on("mouse_exit", () => {
            //console.log("Mouse exited button actor");
            this.setSpritesheet(assets_1.SpriteSheet.BUTTON);
        });
        this.on("mouse_click_up", () => {
            this.callbackFunction();
        });
        this.title = options.title;
    }
    onCreated() {
        this.addText(this.title);
    }
}
exports.Button = Button;
//# sourceMappingURL=button.js.map