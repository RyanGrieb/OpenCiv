"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MPOptionsScene = void 0;
const scene_1 = require("../scene");
const actor_1 = require("../actor");
const game_1 = require("../../game");
const button_1 = require("../../ui/button");
const assets_1 = require("../../assets");
const client_1 = require("../../network/client");
class MPOptionsScene extends scene_1.Scene {
    onInitialize() {
        client_1.WebsocketClient.init();
        //FIXME: Optimize multiple actors
        for (let y = -1; y < game_1.Game.getHeight() / 24; y++) {
            for (let x = -1; x < game_1.Game.getWidth() / 32; x++) {
                let yPos = y * 24;
                let xPos = x * 32;
                if (y % 2 != 0) {
                    xPos += 16;
                }
                this.addActor(new actor_1.Actor({
                    sprite: assets_1.Sprite.OCEAN,
                    x: xPos,
                    y: yPos,
                    width: 32,
                    height: 32,
                }));
            }
        }
        // TODO: onclick callback function...
        this.addActor(new button_1.Button({
            title: "Host Game",
            x: game_1.Game.getWidth() / 2 - 142 / 2 - 150,
            y: game_1.Game.getHeight() / 2 - 42 / 2,
            width: 142,
            height: 42,
            onClicked: () => {
                console.log("singleplayer scene");
            },
        }));
        this.addActor(new button_1.Button({
            title: "Join Game",
            x: game_1.Game.getWidth() / 2 - 142 / 2 + 150,
            y: game_1.Game.getHeight() / 2 - 42 / 2,
            width: 142,
            height: 42,
            onClicked: () => { },
        }));
        this.addActor(new button_1.Button({
            title: "Back",
            x: game_1.Game.getWidth() / 2 - 142 / 2,
            y: game_1.Game.getHeight() / 2 - 42 / 2 + 100,
            width: 142,
            height: 42,
            onClicked: () => {
                game_1.Game.setScene("main_menu");
            },
        }));
    }
}
exports.MPOptionsScene = MPOptionsScene;
//# sourceMappingURL=mpOptionsScene.js.map