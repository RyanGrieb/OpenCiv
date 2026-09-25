import { Game } from "../../Game";
import { ServerEvents } from "../../Events";
import { State } from "../State";
import { GameMap } from "../../map/GameMap";
import { Unit } from "../../unit/Unit";
import { City } from "../../city/City";
import { Job, gracefulShutdown, scheduleJob } from "node-schedule";

import { UnitActions } from "../../unit/UnitActions";
import { Tile } from "../../map/Tile";

export class InGameState extends State {
  private turnTimeJob: Job;
  private currentTurn: number;
  private totalTurnTime: number;
  private turnTime: number;

  // An open spawn tile two steps from `origin` - close enough that the players' starting units are
  // within a move of each other, without touching the other player's units.
  private static findSpawnTwoTilesFrom(origin: Tile, badTileTypes: string[]): Tile | undefined {
    const neighbors = origin.getAdjacentTiles().filter(Boolean);
    const isOpen = (tile: Tile) => tile && !tile.containsTileTypes(badTileTypes) && tile.getUnits().length === 0;

    for (const neighbor of neighbors) {
      for (const candidate of neighbor.getAdjacentTiles()) {
        if (!isOpen(candidate) || candidate === origin || neighbors.includes(candidate)) continue;
        if (candidate.getAdjacentTiles().some((tile) => isOpen(tile) && !neighbors.includes(tile))) return candidate;
      }
    }

    return undefined;
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

    const badTileTypes = [
      "ocean",
      "shallow_ocean",
      "freshwater",
      "mountain",
      "snow",
      "snow_hill",
      "tundra",
      "tundra_hill"
    ];
    let firstSpawnTile: Tile | undefined;

    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        const nearbySpawn =
          firstSpawnTile && Game.getInstance().getGameOptions().spawnPlayersTogether
            ? InGameState.findSpawnTwoTilesFrom(firstSpawnTile, badTileTypes)
            : undefined;

        const spawnTile =
          nearbySpawn ??
          GameMap.getInstance().getRandomTileWith({
            avoidTileTypes: badTileTypes,
            avoidMapEdge: 4
          });
        firstSpawnTile ??= spawnTile;

        spawnTile.addUnit(
          new Unit({
            name: "settler",
            player: player,
            tile: spawnTile,
            isUtility: true,
            actions: [UnitActions.settleCity()]
          })
        );

        //TODO: Re-choose spawn location if warrior can't spawn
        for (const adjTile of spawnTile.getAdjacentTiles()) {
          if (!adjTile || adjTile.containsTileTypes(badTileTypes) || adjTile.getUnits().length > 0) continue;

          // From units.yml, so the starting warrior gets the same combat strength as a built one.
          adjTile.addUnit(Unit.createFromName("Warrior", adjTile, player));
          break;
        }

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

    ServerEvents.call("nextTurn", { turn: this.currentTurn });

    // Queued movement resolves inside the event above, so this catches up any sight change it
    // caused, and converges anything else that shifted sight without announcing it.
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        player.getVisibility().update();
      });
  }
  public onDestroyed() {
    if (this.turnTimeJob) {
      gracefulShutdown();
    }
    GameMap.destroyInstance();
    return super.onDestroyed();
  }
}
