import { WebSocketServer } from "ws";
import { ServerEvents } from "./events";
import { Game } from "./game";
import { GameMap } from "./map/gameMap";
import { Player } from "./player";
import { InGameState } from "./state/type/inGameState";
import { LobbyState } from "./state/type/lobbyState";

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
