import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Unit } from "../../Unit";
import { City } from "../../city/City";
import { Tile } from "../../map/Tile";
import { GameMap } from "../../map/GameMap";
import { InGameScene } from "../../scene/type/InGameScene";
import { CombatPreviewEvent } from "../../ui/hud/CombatPreviewWindow";
import { NotificationData } from "../../notification/Notifications";
import { TestUtils } from "../TestUtils";

// Plays city combat out against a live server, from Player1's side. Both players found a city two
// tiles apart, with a Warrior and an Archer each; the second player joins over a bare websocket and
// only does what a step tells it to. Cities are founded at 1 HP (the cityStartingHealth game option),
// so taking one doesn't need a dozen turns of wearing it down first.
export function setupCityCombatTest(game: Game) {
    const runner = new TestRunner("CityCombat");
    const utils = new TestUtils(game);
    const listener = {};
    let enemySocket: WebSocket | undefined;
    let myCity: City | undefined;
    let enemyCity: City | undefined;
    let enemyCityTile: Tile | undefined;
    let enemyCityName = "";
    let warrior: Unit | undefined;
    let archer: Unit | undefined;
    let enemyWarrior: Unit | undefined;
    let healthBefore = 0;
    let lastPreview: CombatPreviewEvent | undefined;

    const scene = () => game.getCurrentSceneAs<InGameScene>();
    const me = () => utils.getClientPlayer();
    const allUnits = () => {
        const units: Unit[] = [];
        for (const column of GameMap.getInstance().getTiles()) {
            for (const tile of column ?? []) units.push(...(tile?.getUnits() ?? []));
        }
        return units;
    };
    const allCities = () => {
        const cities: City[] = [];
        for (const column of GameMap.getInstance().getTiles()) {
            for (const tile of column ?? []) if (tile?.getCity()) cities.push(tile.getCity());
        }
        return cities;
    };
    const isAlive = (unit: Unit) => allUnits().includes(unit);
    const watch = (tile: Tile) => scene().focusOnTile(tile, 3);
    const clientPlayer = () => me() as unknown as Record<string, any>;
    const strikeAiming = () => clientPlayer()["cityStrikeAiming"] as Record<string, any>;
    const rangedAiming = () => clientPlayer()["rangedAiming"] as Record<string, any>;
    const notifications = (): NotificationData[] => (scene() as unknown as Record<string, any>)["notifications"].getAll();

    const endTurn = async () => {
        WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
        enemySocket.send(JSON.stringify({ event: "nextTurnRequest", value: true }));
        await utils.delay(800);
    };

    const sendAsEnemy = (data: Record<string, unknown>) => enemySocket.send(JSON.stringify(data));

    const settle = (unit: Unit, send: (data: Record<string, unknown>) => void) =>
        send({
            event: "unitAction",
            unitX: unit.getTile().getGridX(),
            unitY: unit.getTile().getGridY(),
            id: unit.getID(),
            actionName: "settle"
        });

    const moveOrder = (unit: Unit, target: Tile) => ({
        event: "moveUnit",
        unitX: unit.getTile().getGridX(),
        unitY: unit.getTile().getGridY(),
        id: unit.getID(),
        targetX: target.getGridX(),
        targetY: target.getGridY()
    });

    // A new city's strength, 8 + 0.4 for its citizen + 2 from the Palace, is 25% more on a hill.
    const expectedStrength = (city: City) => {
        const onHill = city.getTile().getTileTypes().some((type: string) => type.includes("hill"));
        return 10.4 * (onHill ? 1.25 : 1);
    };

    // Every tile one or two steps from `target`, which is how far a city can shoot.
    const tilesWithinTwo = (target: Tile): Tile[] => {
        const tiles = new Set<Tile>();
        for (const neighbor of target.getAdjacentTiles()) {
            if (!neighbor) continue;
            tiles.add(neighbor);
            for (const tile of neighbor.getAdjacentTiles()) if (tile && tile !== target) tiles.add(tile);
        }
        return [...tiles];
    };

    // Of `candidates`, the open land tile that `unit` can reach soonest.
    const nearestFreeTile = (unit: Unit, candidates: Tile[]): Tile | undefined => {
        let best: { tile: Tile; length: number } | undefined;
        for (const tile of candidates) {
            if (!tile || tile.isWater() || tile.getMovementCost() >= 9999 || tile.getCity()) continue;
            if (tile.getUnits().some((other) => other !== unit)) continue;
            if (tile === unit.getTile()) return tile;

            const path = GameMap.getInstance().constructShortestPath(unit, unit.getTile(), tile);
            if (path.length > 1 && (!best || path.length < best.length)) best = { tile, length: path.length };
        }
        return best?.tile;
    };

    // Walks a unit onto the nearest open tile of `candidates`, ending turns until it gets there with movement
    // to spare. `send` is who gives the order: us, or the second player.
    const walkTo = async (unit: Unit, candidates: () => Tile[], send: (data: Record<string, unknown>) => void) => {
        for (let turn = 0; turn < 8; turn++) {
            const destination = nearestFreeTile(unit, candidates());
            if (!destination) throw new Error(`No open tile for the ${unit.getName()} to walk to`);
            if (unit.getTile() === destination && unit.getAvailableMovement() > 0) return;

            if (unit.getTile() !== destination) send(moveOrder(unit, destination));
            await utils.delay(500);
            if (unit.getTile() === destination && unit.getAvailableMovement() > 0) return;
            await endTurn();
        }
        throw new Error(`The ${unit.getName()} couldn't get into position`);
    };
    const sendAsUs = (data: Record<string, unknown>) => WebsocketClient.sendMessage(data);

    runner.addStep({
        name: "Start a revealed-map game where both players have a Warrior and an Archer, and cities start at 1 HP",
        action: async () => {
            enemySocket = await utils.startGameWithSecondPlayer({
                autoEndTurns: false,
                gameOptions: { startWithArcher: true, cityStartingHealth: 1 }
            });
            // Registered once in game - the scene change clears network listeners.
            NetworkEvents.on<CombatPreviewEvent>({
                eventName: "combatPreview",
                parentObject: listener,
                callback: (data) => (lastPreview = data)
            });
            await utils.waitUntil(
                () => allUnits().filter((unit) => unit.getName() === "Settler").length === 2,
                10000,
                "Both Settlers to appear"
            );
            warrior = me().getUnits().find((unit) => unit.getName() === "Warrior");
            archer = me().getUnits().find((unit) => unit.getName() === "Archer");
            enemyWarrior = allUnits().find((unit) => unit.getPlayer() !== me() && unit.getName() === "Warrior");
        },
        verification: () => game.getCurrentScene().getName() === "in_game" && !!warrior && !!archer && !!enemyWarrior
    });

    // Everyone gets into position before the cities are founded, so the enemy city is still at 1 HP
    // when we attack it - cities heal 20 HP a turn.
    runner.addStep({
        name: "Before founding: the enemy Warrior walks within 2 tiles of our Settler, ours up to the enemy Settler",
        action: async () => {
            const mySettler = allUnits().find((unit) => unit.getName() === "Settler" && unit.getPlayer() === me());
            const enemySettler = allUnits().find((unit) => unit.getName() === "Settler" && unit.getPlayer() !== me());
            enemyCityTile = enemySettler.getTile();

            const mySettlerTile = mySettler.getTile();
            if (!tilesWithinTwo(mySettlerTile).includes(enemyWarrior.getTile())) {
                await walkTo(enemyWarrior, () => tilesWithinTwo(mySettlerTile), sendAsEnemy);
            }
            await walkTo(warrior, () => enemyCityTile.getAdjacentTiles().filter(Boolean), sendAsUs);
            // Beside the city if there's room, for a clear shot; otherwise two tiles out.
            await walkTo(
                archer,
                () => {
                    const beside = enemyCityTile.getAdjacentTiles().filter(Boolean);
                    return nearestFreeTile(archer, beside) ? beside : tilesWithinTwo(enemyCityTile);
                },
                sendAsUs
            );
            watch(enemyCityTile);
        },
        verification: () =>
            enemyCityTile.getAdjacentTiles().includes(warrior.getTile()) &&
            tilesWithinTwo(enemyCityTile).includes(archer.getTile()) &&
            warrior.getAvailableMovement() > 0 &&
            archer.getAvailableMovement() > 0
    });

    runner.addStep({
        name: "Both players found a city: 1/200 HP and strength 10.4 (8, +0.4 for the citizen, +2 from the Palace), +25% on a hill",
        action: async () => {
            const settlers = allUnits().filter((unit) => unit.getName() === "Settler");
            settle(settlers.find((unit) => unit.getPlayer() !== me()), sendAsEnemy);
            settle(settlers.find((unit) => unit.getPlayer() === me()), sendAsUs);
            await utils.waitUntil(() => allCities().length === 2, 10000, "Both cities to be founded");

            myCity = allCities().find((city) => city.getPlayer() === me());
            enemyCity = enemyCityTile.getCity();
            enemyCityName = enemyCity.getName();
            // The Palace arrives just after the city does.
            await utils.waitUntil(
                () => [myCity, enemyCity].every((city) => Math.abs(city.getStrength() - expectedStrength(city)) < 0.01),
                5000,
                "The Palace's +2 strength"
            );
            utils.log(
                `Enemy city ${enemyCityName}: ${enemyCity.getHealth()}/${enemyCity.getMaxHealth()} HP, strength ${enemyCity.getStrength().toFixed(1)}`,
                "yellow"
            );
            await utils.delay(1500);
        },
        verification: () => [myCity, enemyCity].every((city) => city.getHealth() === 1 && city.getMaxHealth() === 200)
    });

    runner.addStep({
        name: "An enemy city can't be walked into: it blocks movement like an enemy unit",
        action: async () => {},
        verification: () =>
            enemyCityTile.isImpassableFor(warrior) &&
            enemyCityTile.isBlockedFor(warrior) &&
            !myCity.getTile().isImpassableFor(warrior)
    });

    runner.addStep({
        name: "The enemy city strikes our Archer",
        action: async () => {
            healthBefore = archer.getHealth();
            sendAsEnemy({
                event: "cityStrike",
                cityName: enemyCityName,
                targetX: archer.getTile().getGridX(),
                targetY: archer.getTile().getGridY()
            });
            await utils.waitUntil(() => archer.getHealth() < healthBefore, 5000, "Our Archer to take damage");
            utils.log(`Enemy strike: Archer ${healthBefore} -> ${archer.getHealth()} HP`, "yellow");
        },
        verification: () => archer.getHealth() < healthBefore && isAlive(archer)
    });

    runner.addStep({
        name: "Our Archer shoots the city at 1 HP: it can't go lower, and a ranged unit can't take it",
        action: async () => {
            clientPlayer().selectUnit(archer);
            await utils.waitUntil(() => rangedAiming().canShoot(enemyCityTile), 5000, "The Archer to have the city in range");
            clientPlayer()["previewAttack"](enemyCityTile);
            await utils.waitUntil(() => !!clientPlayer()["combatPreviewWindow"], 5000, "The shot's preview");
            await utils.delay(1500);
            clientPlayer()["moveSelectedUnit"](enemyCityTile);
            await utils.waitUntil(() => archer.getAvailableMovement() === 0, 5000, "The Archer to fire");
            await utils.delay(500);
        },
        verification: () =>
            lastPreview?.defenderCity === enemyCityName &&
            lastPreview.defenderDamage.max === 0 &&
            enemyCity.getHealth() === 1 &&
            enemyCityTile.getCity().getPlayer() !== me()
    });

    runner.addStep({
        name: "Our Warrior attacks the city: brought to 0 HP, it's captured and the Warrior moves in",
        action: async () => {
            clientPlayer().selectUnit(warrior);
            clientPlayer()["previewAttack"](enemyCityTile);
            await utils.waitUntil(() => !!clientPlayer()["combatPreviewWindow"], 5000, "The attack's preview");
            utils.log(`Attack preview: ${lastPreview?.outcome}`, "yellow");
            await utils.delay(1500);
            clientPlayer()["moveSelectedUnit"](enemyCityTile);
            await utils.waitUntil(() => enemyCityTile.getCity()?.getPlayer() === me(), 5000, "The city to change hands");
            watch(enemyCityTile);
            await utils.delay(1500);
        },
        verification: () => {
            const city = enemyCityTile.getCity();
            return (
                city?.getName() === enemyCityName &&
                me().getCities().includes(city) &&
                warrior.getTile() === enemyCityTile &&
                notifications().some((notification) => notification.text === `You have captured ${enemyCityName}!`)
            );
        }
    });

    runner.addStep({
        name: "The captured city can't strike on the turn it changed hands",
        action: async () => {},
        verification: () => !enemyCityTile.getCity().canStrike()
    });

    runner.addStep({
        name: "Our first city has the enemy Warrior in range: its banner and a notification say it can strike",
        action: async () => {
            watch(myCity.getTile());
            await utils.waitUntil(() => myCity.canStrike(), 5000, "Our city to be able to strike");
            await utils.waitUntil(
                () => notifications().some((notification) => notification.type === "cityStrike"),
                5000,
                "The city strike notification"
            );
        },
        verification: () =>
            myCity["strikeIcon"] !== undefined &&
            notifications().some((notification) => notification.cityNames?.includes(myCity.getName()))
    });

    runner.addStep({
        name: "Clicking the notification aims the city: its reach is tinted, and hovering the Warrior previews the strike",
        action: async () => {
            const notification = notifications().find((candidate) => candidate.type === "cityStrike");
            (scene() as unknown as Record<string, any>)["notifications"].act(notification);
            await utils.waitUntil(() => strikeAiming()["overlays"].length > 0, 5000, "The city's reach to be tinted");
            strikeAiming().aimAt(enemyWarrior.getTile());
            await utils.waitUntil(() => !!strikeAiming()["previewWindow"], 5000, "The strike preview to appear");
            utils.log(
                `Preview: ${lastPreview?.outcome}, Warrior loses ${lastPreview?.defenderDamage.min}-${lastPreview?.defenderDamage.max}`,
                "yellow"
            );
            await utils.delay(2000); // Long enough to read it
        },
        verification: () =>
            strikeAiming().isAiming() &&
            strikeAiming()["rangeTiles"].includes(enemyWarrior.getTile()) &&
            lastPreview?.attackerCity === myCity.getName() &&
            lastPreview.attackerDamage.max === 0 &&
            lastPreview.defenderDamage.min > 0
    });

    runner.addStep({
        name: "Left-clicking the Warrior fires: it takes damage, and the city can't strike again this turn",
        action: async () => {
            healthBefore = enemyWarrior.getHealth();
            clientPlayer()["onLeftClickTile"](enemyWarrior.getTile(), -1, -1);
            await utils.waitUntil(() => enemyWarrior.getHealth() < healthBefore, 5000, "The Warrior to take damage");
            await utils.waitUntil(() => !myCity.canStrike(), 5000, "The strike to be spent");
            utils.log(`Strike: Warrior ${healthBefore} -> ${enemyWarrior.getHealth()} HP`, "yellow");
            NetworkEvents.removeCallbacksByParentObject(listener);
        },
        verification: () =>
            !strikeAiming().isAiming() &&
            strikeAiming()["overlays"].length === 0 &&
            !notifications().some((notification) => notification.type === "cityStrike")
    });

    return runner;
}
