import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { City } from "../../city/City";
import { Tile } from "../../map/Tile";
import { Label } from "../../ui/Label";
import { ActorGroup } from "../../scene/ActorGroup";
import { TestUtils } from "../TestUtils";

// Settles a city with the city screen open and ends turns until its borders grow twice. The
// Palace's 1 culture a turn buys the first tile for 20 culture and the second for 32 (Civ 5's
// 20 + (10 * tilesAcquired) ^ 1.1), and each new tile has to touch the territory it grew from.
export function setupBorderExpansionTest(game: Game) {
    const runner = new TestRunner("BorderExpansion");
    const utils = new TestUtils(game);
    let city: City | undefined;
    let territoryBefore: Tile[] = [];

    const endTurnsUntil = async (condition: () => boolean, maxTurns: number, message: string) => {
        for (let turn = 0; turn < maxTurns; turn++) {
            if (condition()) return;
            WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
            await utils.delay(350);
        }
        if (!condition()) throw new Error(`Not reached within ${maxTurns} turns: ${message}`);
    };

    // The "Borders: x/y" line in the open city screen's stats window.
    const borderReadout = (): string | undefined => {
        const cityScreen = utils.getInGameScene()["cityDisplayInfo"];
        const statsWindow: ActorGroup | undefined = cityScreen?.["statsWindow"];
        const label = statsWindow
            ?.getActors()
            .find((actor) => actor instanceof Label && actor.getText().startsWith("Borders:")) as Label | undefined;
        return label?.getText();
    };

    const newTiles = () => city.getTerritory().filter((tile) => !territoryBefore.includes(tile));
    const touchesOldTerritory = (tile: Tile) => tile.getAdjacentTiles().some((adjTile) => territoryBefore.includes(adjTile));

    const growOnce = async (maxTurns: number) => {
        territoryBefore = [...city.getTerritory()];
        await endTurnsUntil(() => city.getTerritory().length > territoryBefore.length, maxTurns, "Borders to grow");
        await utils.delay(500);
        utils.getInGameScene().focusOnTile(newTiles()[0], 3);
        utils.log(`Borders grew to ${newTiles().map((tile) => `${tile.getGridX()},${tile.getGridY()}`).join(" ")}`);
    };

    runner.addStep({
        name: "Settle a city and open its screen: 0/20 culture toward the first new tile",
        action: async () => {
            await utils.ensureInGame();
            const settler = await utils.findUnitWithAction("settle");
            WebsocketClient.sendMessage({
                event: "unitAction",
                unitX: settler.getTile().getGridX(),
                unitY: settler.getTile().getGridY(),
                id: settler.getID(),
                actionName: "settle"
            });
            await utils.waitUntil(() => utils.getClientPlayer().getCities().length > 0, 5000, "City to be founded");
            city = utils.getClientPlayer().getCities()[0];
            await utils.waitUntil(() => city.hasStats(), 5000, "City stats to arrive");

            utils.getInGameScene()["openCityUI"](city);
            await utils.waitUntil(() => !!borderReadout(), 3000, "The border readout to show");
            utils.log(`Readout: ${borderReadout()}`);
        },
        verification: () =>
            city.getTerritory().length === 7 &&
            city.getStat("cultureRequiredToExpand") === 20 &&
            borderReadout().startsWith("Borders: 0/20")
    });

    runner.addStep({
        name: "End turns until the borders grow by one tile touching the old territory",
        action: async () => {
            await growOnce(25);
            utils.log(`Readout: ${borderReadout()}`);
        },
        verification: () =>
            newTiles().length === 1 &&
            touchesOldTerritory(newTiles()[0]) &&
            city.getStat("cultureRequiredToExpand") === 32 &&
            borderReadout().includes("/32")
    });

    runner.addStep({
        name: "Keep going: the second tile costs 32 culture, and the next one 46",
        action: async () => {
            await growOnce(40);
            utils.log(`Readout: ${borderReadout()}`);
        },
        verification: () =>
            newTiles().length === 1 &&
            touchesOldTerritory(newTiles()[0]) &&
            city.getStat("cultureRequiredToExpand") === 46 &&
            borderReadout().includes("/46")
    });

    return runner;
}
