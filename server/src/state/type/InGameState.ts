import { Game } from "../../Game";
import { ServerEvents } from "../../Events";
import { State } from "../State";
import { GameMap } from "../../map/GameMap";
import { Unit } from "../../unit/Unit";
import { City } from "../../city/City";
import { Job, gracefulShutdown, scheduleJob } from "node-schedule";

import { Tile } from "../../map/Tile";
import { MapPresets } from "../../map/MapPresets";
import { Barbarians } from "../../barbarian/Barbarians";
import { Player } from "../../Player";
import { PlayerNotifications } from "../../notification/PlayerNotifications";

export class InGameState extends State {
  private turnTimeJob: Job;
  private currentTurn: number;
  private totalTurnTime: number;
  private turnTime: number;

  // Where no player's starting units may be placed.
  private static readonly SPAWN_AVOID_TILE_TYPES = [
    "ocean",
    "shallow_ocean",
    "freshwater",
    "mountain",
    "snow",
    "snow_hill",
    "tundra",
    "tundra_hill"
  ];

  // Anywhere suitable on the map - or, with the spawnPlayersTogether option, two tiles from the first
  // player's settler, falling back to anywhere if nothing that close is open. `edgeBuffer` keeps the
  // spawn that many tiles in from the map's edges.
  private static chooseSpawnTile(firstSpawnTile: Tile | undefined, edgeBuffer = 4): Tile {
    const spawnTogether = firstSpawnTile && Game.getInstance().getGameOptions().spawnPlayersTogether;
    const nearbyTile = spawnTogether ? InGameState.findSpawnTwoTilesFrom(firstSpawnTile) : undefined;

    return (
      nearbyTile ??
      GameMap.getInstance().getRandomTileWith({
        avoidTileTypes: InGameState.SPAWN_AVOID_TILE_TYPES,
        avoidMapEdge: edgeBuffer
      })
    );
  }

  // The mapPreset game option: picks the first player's spawn far enough in from the edges for the
  // preset's patch, stamps the patch around it, and gives the player the preset's extra units.
  private static spawnOnMapPreset(player: Player, presetName: string): Tile {
    const preset = MapPresets.get(presetName);
    const spawnTile = InGameState.chooseSpawnTile(undefined, Math.max(4, preset.radius + 1));

    const stamped = MapPresets.stamp(preset, GameMap.getInstance().getTiles(), spawnTile);
    console.log(`Stamped map preset "${preset.name}" around ${spawnTile.getX()},${spawnTile.getY()}`);

    for (const { tile, cell } of stamped) {
      if (cell.unit) tile.addUnit(Unit.createFromName(cell.unit, tile, player));
    }

    return spawnTile;
  }

  private static isOpenSpawnTile(tile: Tile | undefined): boolean {
    return !!tile && !tile.containsTileTypes(InGameState.SPAWN_AVOID_TILE_TYPES) && tile.getUnits().length === 0;
  }

  // An open spawn tile two steps from `origin` - close enough that the players' starting units are
  // within a move of each other, without touching the other player's units.
  private static findSpawnTwoTilesFrom(origin: Tile): Tile | undefined {
    const neighbors = origin.getAdjacentTiles().filter(Boolean);

    // Tiles two steps out, keeping one with an open tile beside it (on the far side) for its warrior.
    const twoStepsOut = neighbors
      .flatMap((neighbor) => neighbor.getAdjacentTiles())
      .filter((tile) => InGameState.isOpenSpawnTile(tile) && tile !== origin && !neighbors.includes(tile));

    return twoStepsOut.find((candidate) =>
      candidate.getAdjacentTiles().some((tile) => InGameState.isOpenSpawnTile(tile) && !neighbors.includes(tile))
    );
  }

  // The startWithAllTechs / startWithBuilder / startWithArcher game options, for trying out Builder
  // improvements and ranged combat.
  private static applyDebugStart(player: Player, spawnTile: Tile) {
    const options = Game.getInstance().getGameOptions();
    if (options.startWithAllTechs) player.researchAllTechs();
    if (options.startWithBuilder) InGameState.addUnitBeside(spawnTile, "Builder", player, true);
    if (options.startWithArcher) InGameState.addUnitBeside(spawnTile, "Archer", player, false);
  }

  // Any land beside the Settler will do - a civilian can share a tile with the Warrior, a military unit can't.
  private static addUnitBeside(spawnTile: Tile, unitName: string, player: Player, isUtility: boolean) {
    const tile = spawnTile
      .getAdjacentTiles()
      .find(
        (candidate) =>
          candidate && !candidate.isWater() && candidate.isWorkable() && candidate.canPlaceUnit(player, isUtility)
      );
    tile?.addUnit(Unit.createFromName(unitName, tile, player));
  }

  public onInitialize() {
    this.totalTurnTime = 60; //TODO: Allow modification
    this.currentTurn = 0;
    this.turnTime = 0;

    // Set loading screen for players
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        player.sendNetworkEvent({ event: "setScene", scene: "loading_scene" });
      });

    GameMap.init();

    console.log("InGame state initialized");
    //TODO: Instead of an error message, make the player a spectator
    ServerEvents.on({
      eventName: "connection",
      parentObject: this,
      callback: (data, websocket) => {
        console.log("Connection attempted while game in progress...");
        websocket.send(
          JSON.stringify({
            event: "messageBox",
            messageName: "gameInProgress",
            message: "Connection Error: Game in progress."
          })
        );
        websocket.close();
      }
    });

    ServerEvents.on({
      eventName: "requestMap",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        GameMap.getInstance().sendMapChunksToPlayer(player);
      }
    });

    ServerEvents.on({
      eventName: "requestTileYields",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        GameMap.getInstance().sendTileYieldsToPlayer(player);
      }
    });

    let firstSpawnTile: Tile | undefined;

    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        const mapPreset = Game.getInstance().getGameOptions().mapPreset;
        const spawnTile =
          !firstSpawnTile && mapPreset
            ? InGameState.spawnOnMapPreset(player, mapPreset)
            : InGameState.chooseSpawnTile(firstSpawnTile);
        firstSpawnTile ??= spawnTile;

        // From units.yml, so starting units match built ones (combat strength, the Settler's action).
        spawnTile.addUnit(Unit.createFromName("Settler", spawnTile, player));

        //TODO: Re-choose spawn location if warrior can't spawn
        const warriorTile = spawnTile.getAdjacentTiles().find(InGameState.isOpenSpawnTile);
        warriorTile?.addUnit(Unit.createFromName("Warrior", warriorTile, player));

        InGameState.applyDebugStart(player, spawnTile);

        player.onLoadedIn(() => {
          player.zoomToLocation(spawnTile.getX(), spawnTile.getY(), 3);

          let allLoaded = true;
          // Trigger allPlayersLoaded event
          Game.getInstance()
            .getPlayers()
            .forEach((player) => {
              if (!player.isLoadedIn()) {
                allLoaded = false;
              }
            });

          if (allLoaded) {
            ServerEvents.call("allPlayersLoaded", {});
          }
        });

        player.sendNetworkEvent({ event: "setScene", scene: "in_game" });
      });

    // After every civ has its starting units, so the first camps keep their distance from them.
    // Clients only ask for the players list (barbarians included) once they get the scene change
    // above, and that can't be handled before this finishes.
    if (Game.getInstance().getGameOptions().allowBarbarians) {
      Barbarians.init();
    }

    ServerEvents.on({
      eventName: "allPlayersLoaded",
      parentObject: this,
      callback: () => {
        // Increment the turn
        this.incrementTurn();
        this.beginTurnTimer();
      }
    });

    ServerEvents.on({
      eventName: "nextTurnRequest",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        player.setRequestedNextTurn(data["value"]);

        const allRequested = Array.from(Game.getInstance().getPlayers().values()).every((player) =>
          player.hasRequestedNextTurn()
        );

        if (allRequested) {
          this.incrementTurn();
          Game.getInstance()
            .getPlayers()
            .forEach((player) => {
              player.setRequestedNextTurn(false);
            });
        }
      }
    });
  }

  // Decrease trunTime by -1 every 1 second
  private beginTurnTimer() {
    this.turnTimeJob = scheduleJob("* * * * * *", () => {
      // Send turn time increment to player
      Game.getInstance()
        .getPlayers()
        .forEach((player) => {
          player.sendNetworkEvent({
            event: "turnTimeDecrement",
            turn: this.currentTurn,
            turnTime: this.turnTime
          });
        });

      //FIXME: WAIT for all players timers to be 0!
      if (this.turnTime <= 0) {
        // CHECK IF ALL PLAYERS TIME'S ARE <= 0, THEN INCREMENT.
        this.incrementTurn();
      }

      this.turnTime -= 1;
    });
  }

  private incrementTurn() {
    this.currentTurn++;
    this.turnTime = this.totalTurnTime;

    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        player.sendNetworkEvent({
          event: "newTurn",
          turn: this.currentTurn,
          turnTime: this.turnTime
        });
      });

    // Last turn's messages are cleared before this turn's processing adds new ones.
    Game.getInstance()
      .getPlayers()
      .forEach((player) => player.getNotifications().startTurn(this.currentTurn));

    ServerEvents.call("nextTurn", { turn: this.currentTurn });

    // Once every unit's movement is back to full from the event above.
    Barbarians.getInstance()?.playTurn();

    // Queued movement resolves inside the event above, so this catches up any sight change it
    // caused, and converges anything else that shifted sight without announcing it.
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        player.getVisibility().update();
      });

    PlayerNotifications.refreshAll();
    City.refreshAllCombatStatus();
  }
  public onDestroyed() {
    if (this.turnTimeJob) {
      gracefulShutdown();
    }
    Barbarians.destroyInstance();
    GameMap.destroyInstance();
    return super.onDestroyed();
  }
}
