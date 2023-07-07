import { Game } from "../../Game";
import { ServerEvents } from "../../Events";
import { State } from "../State";
import { GameMap } from "../../map/GameMap";
import { Server } from "http";
import { Unit } from "../../Unit";
import { City } from "../../city/City";

export class InGameState extends State {
  private currentTurn: number;
  private turnTime: number;

  public onInitialize() {
    this.currentTurn = 0;
    this.turnTime = 0;

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
        GameMap.sendMapChunksToPlayer(player);
      },
    });

    ServerEvents.on({
      eventName: "playersData",
      parentObject: this,
      callback: (data, websocket) => {
        const playersDataJSON = [];

        Game.getPlayers().forEach((player) => {
          playersDataJSON.push({
            name: player.getName(),
            clientPlayer: player.getWebsocket() === websocket,
          });
        });

        websocket.send(
          JSON.stringify({
            event: "playersData",
            players: playersDataJSON,
          })
        );
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

      const spawnTile = GameMap.getRandomTileWith({
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
              requirements: ["awayFromCity"],
              desc: "Settle City",
              onAction: (unit: Unit) => {
                console.log("ACTION: Act on settle city.");
                const tile = unit.getTile();
                unit.delete();
                tile.setCity(new City({ player: player, tile: tile }));
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
      },
    });
  }

  public incrementTurn() {
    this.currentTurn++;
    this.turnTime += 60;
    Game.getPlayers().forEach((player) => {
      player.sendNetworkEvent({
        event: "newTurn",
        turn: this.currentTurn,
        turnTime: this.turnTime,
      });
    });
  }
  public onDestroyed() {
    return super.onDestroyed();
  }
}
