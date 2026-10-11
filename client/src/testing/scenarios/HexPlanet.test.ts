import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { GlobePrototype } from "../../globe/GlobePrototype";

// Not a test: opens the hex planet prototype - the game's terrain sprites on a hex sphere inside a
// small solar system, drawn with three.js - to try how a spherical map looks, moves and performs.
// Client-only, on a random map; the 2D game underneath is paused while it's open.
export function setupHexPlanetTest(game: Game) {
    const runner = new TestRunner("HexPlanet");

    runner.addStep({
        name: "Open the hex planet prototype",
        action: async () => {
            if (game.getCurrentScene()) game.toggleGameLoop();
            game.getCanvas().style.display = "none";
            GlobePrototype.open();

            const results = document.getElementById("test-results");
            if (results) results.style.display = "none";
        },
        verification: () => !!document.getElementById("globe-canvas")
    });

    return runner;
}
