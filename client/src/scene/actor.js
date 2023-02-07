"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Actor = void 0;
const assets_1 = require("../assets");
const game_1 = require("../game");
class Actor {
    constructor(actorOptions) {
        this.storedEvents = new Map();
        this.color = actorOptions.color;
        this.spritesheet =
            actorOptions.spritesheet == undefined ? assets_1.SpriteSheet.MAIN : actorOptions.spritesheet;
        this.sprite = actorOptions.sprite;
        this.image = actorOptions.image;
        this.x = actorOptions.x;
        this.y = actorOptions.y;
        this.width = actorOptions.width;
        this.height = actorOptions.height;
        this.on("mouse_move", (options) => {
            if (this.insideActor(options.x, options.y)) {
                if (!this.mouseInside) {
                    this.call("mouse_enter");
                    this.mouseInside = true;
                }
            }
            else {
                if (this.mouseInside) {
                    this.call("mouse_exit");
                }
                this.mouseInside = false;
            }
        });
        this.on("mouse_up", (options) => {
            if (this.insideActor(options.x, options.y)) {
                //FIXME: Distinguish mouse_up & mouse_click_up better?
                this.call("mouse_click_up");
            }
        });
    }
    draw() {
        game_1.Game.drawImageFromActor(this);
        //TODO: Allow user to change where the text is drawn...
        if (this.text) {
            const metrics = game_1.Game.getCanvasContext().measureText(this.text);
            let textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            game_1.Game.drawText({
                text: this.text,
                x: this.x + this.width / 2 - metrics.width / 2,
                y: this.y + this.height / 2 + textHeight / 2,
                color: "black",
            });
        }
    }
    onCreated() { }
    call(eventName, options) {
        if (this.storedEvents.has(eventName)) {
            //Call the stored callback function
            this.storedEvents.get(eventName)(options);
        }
    }
    on(eventName, callback) {
        this.storedEvents.set(eventName, callback);
    }
    insideActor(x, y) {
        if (x >= this.x && x <= this.x + this.width) {
            //console.log("in x-bounds");
            if (y >= this.y && y <= this.y + this.height) {
                //console.log("in y-bounds");
                return true;
            }
        }
        return false;
    }
    setSpritesheet(spritesheet) {
        this.spritesheet = spritesheet;
    }
    addText(text) {
        this.text = text;
    }
    getImage() {
        console.log(this.spritesheet);
        if (this.image) {
            return this.image;
        }
        return game_1.Game.getImage(this.spritesheet);
    }
    getX() {
        return this.x;
    }
    getY() {
        return this.y;
    }
    getWidth() {
        return this.width;
    }
    getHeight() {
        return this.height;
    }
    getColor() {
        return this.color;
    }
    getSprite() {
        return this.sprite;
    }
    getSpritesheet() {
        return this.spritesheet;
    }
}
exports.Actor = Actor;
//# sourceMappingURL=actor.js.map