"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scene = void 0;
const actor_1 = require("./actor");
const game_1 = require("../game");
const assets_1 = require("../assets");
class Scene {
    constructor() {
        // Use a Map<> ?
        this.actors = [];
    }
    addActor(actor) {
        this.actors.push(actor);
        game_1.Game.addActor(actor);
    }
    gameLoop() {
        this.actors.forEach((actor) => {
            actor.draw();
        });
    }
    generateSingleActor(actors) {
        // Create dummy canvas to get pixel data of the actor sprite
        let canvas = document.createElement("canvas");
        let greatestXWidth = 0; // The width of the actor w/ the greatest x.
        let greatestYHeight = 0; // The height of the actor w/ the greatest y.
        let greatestX = 0;
        let greatestY = 0;
        actors.forEach((actor) => {
            if (actor.getX() > greatestX) {
                greatestX = actor.getX();
                greatestXWidth = actor.getWidth();
            }
            if (actor.getY() > greatestY) {
                greatestY = actor.getY();
                greatestYHeight = actor.getHeight();
            }
        });
        canvas.width = greatestX + greatestXWidth;
        canvas.height = greatestY + greatestYHeight;
        actors.forEach((actor) => {
            const spriteX = parseInt(actor.getSprite().split(",")[0]) * 32;
            const spriteY = parseInt(actor.getSprite().split(",")[1]) * 32;
            canvas
                .getContext("2d")
                .drawImage(game_1.Game.getImage(assets_1.SpriteSheet.MAIN), spriteX, spriteY, 32, 32, actor.getX(), actor.getY(), actor.getWidth(), actor.getHeight());
        });
        let image = new Image();
        image.src = canvas.toDataURL();
        let mergedActor = new actor_1.Actor({
            image: image,
            x: actors[0].getX(),
            y: actors[0].getY(),
            width: canvas.width,
            height: canvas.height,
        });
        return mergedActor;
    }
    onInitialize() { }
    onDestroyed() { }
}
exports.Scene = Scene;
//# sourceMappingURL=scene.js.map