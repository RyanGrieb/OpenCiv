"use strict";
//TODO: Have different objects/functions for sounds,spritesheets,images.
//TODO: Preload all images into textures
//TODO: Handle spritesheet into textures
//TODO: Preload all sounds
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetList = exports.Sprite = exports.SpriteSheet = exports.spritehseetSize = void 0;
exports.spritehseetSize = 20; //20x20
var SpriteSheet;
(function (SpriteSheet) {
    SpriteSheet[SpriteSheet["BUTTON"] = 0] = "BUTTON";
    SpriteSheet[SpriteSheet["BUTTON_HOVERED"] = 1] = "BUTTON_HOVERED";
    SpriteSheet[SpriteSheet["MAIN"] = 2] = "MAIN";
})(SpriteSheet = exports.SpriteSheet || (exports.SpriteSheet = {}));
var Sprite;
(function (Sprite) {
    Sprite["ARCHER"] = "0,0";
    Sprite["BUILDER"] = "1,0";
    Sprite["CAMEL_ARCHER"] = "2,0";
    Sprite["OCEAN"] = "16,6";
})(Sprite = exports.Sprite || (exports.Sprite = {}));
exports.assetList = [
    require("../assets/images/ui_button.png"),
    require("../assets/images/ui_button_hovered.png"),
    require("../assets/images/spritesheet.png"),
    require("../assets/images/font.png"),
    require("../assets/images/logo.png"),
];
//# sourceMappingURL=assets.js.map