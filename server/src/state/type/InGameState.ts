import { Game } from "../../Game";
import { ServerEvents } from "../../Events";
import { State } from "../State";
import { GameMap } from "../../map/GameMap";
import { Unit } from "../../Unit";
import { City } from "../../city/City";
import { Job, gracefulShutdown, scheduleJob } from "node-schedule";

import fs from "fs";
import YAML from "yaml";

export class InGameState extends State {
  private turnTimeJob: Job;
  private currentTurn: number;
  private totalTurnTime: number;
  private turnTime: number;
  private cityBuildings: Record<string, any>[];

  public onInitialize() {
    this.totalTurnTime = 60; //TODO: Allow modification
    this.currentTurn = 0;
    this.turnTime = 0;

    // Load available buildings from config file
    const buildingsYMLData = YAML.parse(
      fs.readFileSync("./config/buildings.yml", "utf-8")
    );
    //Convert civsData from YAML to JSON:
    this.cityBuildings = JSON.parse(JSON.stringify(buildingsYMLData.buildings));

    // Set loading screen for players
    Game.getPlayers().forEach((player) => {
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
            message: "Connection Error: Game in progress.",
          })
        );
        websocket.close();
      },
    });

    ServerEvents.on({
      eventName: "requestMap",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getPlayerFromWebsocket(websocket);
        GameMap.getInstance().sendMapChunksToPlayer(player);
      },
    });

    Game.getPlayers().forEach((player) => {
      const badTileTypes = [
        "ocean",
        "shallow_ocean",
        "freshwater",
        "mountain",
        "snow",
        "snow_hill",
        "tundra",
        "tundra_hill",
      ];

      const spawnTile = GameMap.getInstance().getRandomTileWith({
        avoidTileTypes: badTileTypes,
      });

      //FIXME: Make Unit have a createSettler() method?
      spawnTile.addUnit(
        new Unit({
          name: "settler",
          player: player,
          tile: spawnTile,
          actions: [
            {
              name: "settle",
              icon: "SETTLE_ICON",
              requirements: ["awayFromCity", "movement"],
              desc: "Settle City",
              onAction: (unit: Unit) => {
                console.log("ACTION: Act on settle city.");

                const tile = unit.getTile();
                unit.delete();

                const city = new City({ player: player, tile: tile });
                tile.setCity(city);
                player.getCities().push(city);

                Game.getPlayers().forEach((gamePlayer) => {
                  gamePlayer.sendNetworkEvent({
                    event: "newCity",
                    ...city.getJSON(),
                  });
                });

                // Add palace to city if it's the first city
                if (player.getCities().length < 2) {
                  city.addBuilding("palace");
                }
              },
            },
          ],
        })
      );

      //TODO: Re-choose spawn location if warrior can't spawn
      for (const adjTile of spawnTile.getAdjacentTiles()) {
        if (!adjTile || adjTile.containsTileTypes(badTileTypes)) continue;

        adjTile.addUnit(
          new Unit({
            name: "warrior",
            player: player,
            tile: adjTile,
            attackType: "melee",
            actions: [],
          })
        );
        break;
      }

      player.onLoadedIn(() => {
        player.zoomToLocation(spawnTile.getX(), spawnTile.getY(), 7);

        let allLoaded = true;
        // Trigger allPlayersLoaded event
        Game.getPlayers().forEach((player) => {
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
      },
    });

    ServerEvents.on({
      eventName: "nextTurnRequest",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getPlayerFromWebsocket(websocket);
        player.setRequestedNextTurn(data["value"]);

        const allRequested = Array.from(Game.getPlayers().values()).every(
          (player) => player.hasRequestedNextTurn()
        );

        if (allRequested) {
          this.incrementTurn();
          Game.getPlayers().forEach((player) => {
            player.setRequestedNextTurn(false);
          });
        }
      },
    });
  }

  public getBuildingDataByName(name: string) {
    for (const building of this.cityBuildings) {
      if (
        (building.name as string).toLocaleLowerCase() ===
        name.toLocaleLowerCase()
      ) {
        return building;
      }
    }

    return undefined;
  }

  // Decrease trunTime by -1 every 1 second
  private beginTurnTimer() {
    this.turnTimeJob = scheduleJob("* * * * * *", () => {
      // Send turn time increment to player
      Game.getPlayers().forEach((player) => {
        player.sendNetworkEvent({
          event: "turnTimeDecrement",
          turn: this.currentTurn,
          turnTime: this.turnTime,
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

    Game.getPlayers().forEach((player) => {
      player.sendNetworkEvent({
        event: "newTurn",
        turn: this.currentTurn,
        turnTime: this.turnTime,
      });
    });

    ServerEvents.call("nextTurn", { turn: this.currentTurn });
  }
  public onDestroyed() {
    if (this.turnTimeJob) {
      gracefulShutdown();
    }
    GameMap.destroyInstance();
    return super.onDestroyed();
  }
}
