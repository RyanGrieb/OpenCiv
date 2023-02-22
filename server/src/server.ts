import { WebSocketServer } from "ws";
import { Game } from "./game";
import { Lobby } from "./state/type/lobby";

const port = 2000; //TODO: This will be assigned by the server indexer.
const wss = new WebSocketServer({ port });

wss.on("connection", (websocket, request) => {
  websocket.on("message", (data: string) => {
    //const jsonData = JSON.parse(data);
    //console.log("Message: " + data);
  });
  Game.call("playerJoin", { playerName: "Player1" });

  websocket.send(JSON.stringify({ event: "setScene", scene: "lobby" }));
});

wss.on("close", (args: any) => {
  console.log("Leave?");
  console.log(args); // Is it called args?
});
console.log("Server initialized on port: " + port);
Game.addState("lobby", new Lobby());
Game.setState("lobby");
