import { exit } from "process";
import { WebSocketServer } from "ws";
import { ServerEvents } from "./Events";
import { Game } from "./Game";
import { GameMap } from "./map/GameMap";
import { Tile } from "./map/Tile";
import { Player } from "./Player";
import { InGameState } from "./state/type/InGameState";
import { LobbyState } from "./state/type/LobbyState";

const port = 2000; //TODO: This will be assigned by the server indexer.
const wss = new WebSocketServer({ port });

wss.on("connection", (websocket, request) => {
  websocket.on("message", (data: string) => {
    console.log("Message: " + data);
    const jsonData = JSON.parse(data);
    ServerEvents.call(jsonData["event"], jsonData, websocket);
  });
  ServerEvents.call("connection", {}, websocket);
});

console.log("Server initialized on port: " + port);

Game.init();
Game.addState("lobby", new LobbyState());
Game.addState("in_game", new InGameState());

Game.setState("lobby");
