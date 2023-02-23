import { WebSocketServer } from "ws";
import { Game } from "./game";
import { Player } from "./player";
import { InGameState } from "./state/type/inGameState";
import { LobbyState } from "./state/type/lobbyState";

const port = 2000; //TODO: This will be assigned by the server indexer.
const wss = new WebSocketServer({ port });
let playerIndex = 1;

wss.on("connection", (websocket, request) => {
  websocket.on("message", (data: string) => {
    console.log("Message: " + data);
    const jsonData = JSON.parse(data);
    Game.call(jsonData["event"], jsonData, websocket);
  });

  // Initialize player object
  const playerName = "Player" + playerIndex;
  const newPlayer = new Player(playerName, websocket);
  Game.getPlayers().set(playerName, newPlayer);

  playerIndex++;

  Game.call("playerJoin", { playerName: "Player1" }, websocket);
  websocket.send(JSON.stringify({ event: "setScene", scene: "lobby" }));
});

wss.on("close", (args: any) => {
  console.log("Leave?");
  console.log(args); // Is it called args?
});

console.log("Server initialized on port: " + port);

Game.init();
Game.addState("lobby", new LobbyState());
Game.addState("in_game", new InGameState());

Game.setState("lobby");
