"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
class Game {
    static init(options, callback) {
        var _a;
        this.scenes = new Map();
        //Initialize canvas
        this.canvas = document.getElementById("canvas");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvasContext = this.canvas.getContext("2d");
        this.canvasContext.fillStyle = (_a = options.canvasColor) !== null && _a !== void 0 ? _a : "white";
        this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvasContext.font = "12px Times new Roman";
        //Initialize canvas listeners
        this.canvas.addEventListener("mousemove", (event) => {
            this.actors.forEach((actor) => {
                actor.call("mouse_move", { x: event.clientX, y: event.clientY });
            });
        });
        this.canvas.addEventListener("mouseup", (event) => {
            this.actors.forEach((actor) => {
                actor.call("mouse_up", { x: event.clientX, y: event.clientY });
            });
        });
        let promise = this.loadAssetPromise(options.assetList);
        promise.then((res) => {
            console.log("All assets loaded...");
            //Update HTML & show canvas
            document.getElementById("loading_element").setAttribute("hidden", "true");
            document.getElementById("canvas").removeAttribute("hidden");
            window.requestAnimationFrame(() => {
                this.gameLoop();
            });
            // Call the callback loop, now we can progress with adding actors,scenes,ect.
            callback();
        });
    }
    static gameLoop() {
        this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (Date.now() - this.lastTimeUpdate >= 1000) {
            this.fps = this.countedFrames;
            this.lastTimeUpdate = Date.now();
            this.countedFrames = 0;
        }
        // Call the gameloop
        this.currentScene.gameLoop();
        this.drawText({ text: "FPS: " + this.fps, x: 0, y: 10, color: "black" });
        this.countedFrames++;
        window.requestAnimationFrame(() => {
            this.gameLoop();
        });
    }
    static loadAssetPromise(assetList) {
        let imagesLoaded = 0;
        const resultPromise = new Promise((resolve, reject) => {
            for (let index in assetList) {
                let image = new Image();
                image.onload = () => {
                    imagesLoaded++;
                    console.log("Loaded: " + assetList[index]);
                    if (imagesLoaded == assetList.length) {
                        // We loaded all images, resolve the promise
                        resolve(0);
                    }
                };
                image.src = assetList[index];
                this.images.push(image);
            }
        });
        return resultPromise;
    }
    static addScene(sceneName, scene) {
        this.scenes.set(sceneName, scene);
    }
    static setScene(sceneName) {
        if (this.currentScene != null) {
            this.currentScene.onDestroyed();
        }
        this.currentScene = this.scenes.get(sceneName);
        this.currentScene.onInitialize();
    }
    static addActor(actor) {
        console.log("Add actor");
        this.actors.push(actor);
        this.drawImageFromActor(actor);
        actor.onCreated();
    }
    static drawImageFromActor(actor) {
        if (actor.getSprite() != undefined) {
            const spriteX = parseInt(actor.getSprite().split(",")[0]) * 32;
            const spriteY = parseInt(actor.getSprite().split(",")[1]) * 32;
            this.canvasContext.drawImage(actor.getImage(), 
            //TODO: Calculate sprite position
            spriteX, spriteY, 32, 32, actor.getX(), actor.getY(), actor.getWidth(), actor.getHeight());
        }
        else {
            this.canvasContext.drawImage(actor.getImage(), actor.getX(), actor.getY(), actor.getWidth(), actor.getHeight());
        }
    }
    static drawText(textOptions) {
        var _a, _b;
        //FIXME: Use cache for meausring text..
        const metrics = this.canvasContext.measureText(textOptions.text);
        let textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        const xPos = (_a = textOptions.x) !== null && _a !== void 0 ? _a : textOptions.actor.getX();
        const yPos = (_b = textOptions.y) !== null && _b !== void 0 ? _b : textOptions.actor.getY() +
            textOptions.actor.getHeight() / 2 +
            textHeight / 2;
        const oldColor = this.canvasContext.fillStyle;
        this.canvasContext.save();
        this.canvasContext.fillStyle = textOptions.color;
        this.canvasContext.fillText(textOptions.text, xPos, yPos);
        this.canvasContext.restore();
    }
    static getImage(imageType) {
        //FIXME: Check imageType, if texture call: this.images[textureType];
        // If Sprite, get image from spritesheet & then call this.images[textureFromSprite]
        return this.images[imageType];
    }
    static getHeight() {
        return this.canvas.height;
    }
    static getWidth() {
        return this.canvas.width;
    }
    static getCanvasContext() {
        return this.canvasContext;
    }
    static getCanvas() {
        return this.canvas;
    }
}
exports.Game = Game;
Game.images = [];
Game.countedFrames = 0;
Game.lastTimeUpdate = Date.now();
Game.fps = 0;
Game.actors = [];
//# sourceMappingURL=game.js.map