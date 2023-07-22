import { Game } from "../../Game";
import { ServerEvents } from "../../Events";
import { Player } from "../../Player";
import { State } from "../State";
import fs from "fs";
import random from "random";
import YAML from "yaml";

let playerIndex = 1;

export class LobbyState extends State {
  private playableCivs: any[];

  public onInitialize() {
    console.log("Lobby state initialized");
    playerIndex = 1;

    // Load available civilizations from config file
    const civYAMLData = YAML.parse(
      fs.readFileSync("./config/civilizations.yml", "utf-8")
    );
    //Convert civsData from YAML to JSON:
    this.playableCivs = JSON.parse(JSON.stringify(civYAMLData.civilizations));

    ServerEvents.on({
      eventName: "connection",
      parentObject: this,
      callback: (data, websocket) => {
        // Initialize player name
        const playerName = "Player" + playerIndex;
        playerIndex++;

        console.log(playerName + " has joined the lobby");

        const newPlayer = new Player(playerName, websocket);
        Game.getPlayers().set(playerName, newPlayer);

        // Send playerJoin data to other connected players
        for (const player of Array.from(Game.getPlayers().values())) {
          player.sendNetworkEvent({
            event: "playerJoin",
            playerName: playerName,
          });
        }

        newPlayer.sendNetworkEvent({ event: "setScene", scene: "lobby" });
      },
    });

    ServerEvents.on({
      eventName: "availableCivs",
      parentObject: this,
      callback: (_, websocket) => {
        const player = Game.getPlayerFromWebsocket(websocket);
        const playableCivs = [];

        //Extract name and icon_name from playableCivs:
        for (const civ of this.playableCivs) {
          playableCivs.push({ name: civ.name, icon_name: civ.icon_name });
        }

        player.sendNetworkEvent({
          event: "availableCivs",
          civs: playableCivs,
        });
      },
    });
  }

  public onDestroyed() {
    return super.onDestroyed();
  }
}
