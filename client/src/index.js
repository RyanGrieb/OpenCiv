"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assets_1 = require("./assets");
const game_1 = require("./game");
const mainMenuScene_1 = require("./scene/type/mainMenuScene");
const mpOptionsScene_1 = require("./scene/type/mpOptionsScene");
game_1.Game.init({ assetList: assets_1.assetList, canvasColor: "gray" }, () => {
    game_1.Game.addScene("main_menu", new mainMenuScene_1.MainMenuScene());
    game_1.Game.addScene("mp_options", new mpOptionsScene_1.MPOptionsScene());
    game_1.Game.setScene("main_menu");
});
//# sourceMappingURL=index.js.map