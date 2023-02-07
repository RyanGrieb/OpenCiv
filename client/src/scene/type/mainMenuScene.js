"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainMenuScene = void 0;
const scene_1 = require("../scene");
const actor_1 = require("../actor");
const game_1 = require("../../game");
const button_1 = require("../../ui/button");
const assets_1 = require("../../assets");
class MainMenuScene extends scene_1.Scene {
    onInitialize() {
        let tileActors = [];
        //FIXME: Optimize multiple actors
        for (let y = -1; y < game_1.Game.getHeight() / 24; y++) {
            for (let x = -1; x < game_1.Game.getWidth() / 32; x++) {
                let yPos = y * 24;
                let xPos = x * 32;
                if (y % 2 != 0) {
                    xPos += 16;
                }
                tileActors.push(new actor_1.Actor({
                    sprite: assets_1.Sprite.OCEAN,
                    x: xPos,
                    y: yPos,
                    width: 32,
                    height: 32,
                }));
            }
        }
        this.addActor(this.generateSingleActor(tileActors));
        // TODO: onclick callback function...
        this.addActor(new button_1.Button({
            title: "Singleplayer",
            x: game_1.Game.getWidth() / 2 - 142 / 2,
            y: game_1.Game.getHeight() / 3,
            width: 142,
            height: 42,
            onClicked: () => {
                console.log("singleplayer scene");
            },
        }));
        this.addActor(new button_1.Button({
            title: "Multiplayer",
            x: game_1.Game.getWidth() / 2 - 142 / 2,
            y: game_1.Game.getHeight() / 3 + 50,
            width: 142,
            height: 42,
            onClicked: () => {
                game_1.Game.setScene("mp_options");
            },
        }));
        this.addActor(new button_1.Button({
            title: "Options",
            x: game_1.Game.getWidth() / 2 - 142 / 2,
            y: game_1.Game.getHeight() / 3 + 100,
            width: 142,
            height: 42,
            onClicked: () => {
                console.log("options scene");
            },
        }));
        this.addActor(new actor_1.Actor({
            sprite: assets_1.Sprite.BUILDER,
            x: 32,
            y: 32,
            width: 32,
            height: 32,
        }));
        this.addActor(new actor_1.Actor({
            sprite: assets_1.Sprite.ARCHER,
            x: 64,
            y: 32,
            width: 32,
            height: 32,
        }));
    }
}
exports.MainMenuScene = MainMenuScene;
//# sourceMappingURL=mainMenuScene.js.map