import { WebSocketServer } from "ws";
import { Game } from "./game";
import { Lobby } from "./state/type/lobby";

const port = 2000; //TODO: This will be assigned by the server indexer.
const wss = new WebSocketServer({ port });

wss.on("connection", (ws) => {
  ws.on("message", (data: string) => {
    //const jsonData = JSON.parse(data);
    //console.log("Message: " + data);
  });
  Game.call("playerJoin", { playerName: "Player1" });

  ws.send("You connected");
});
console.log("Server initialized on port: " + port);

Game.addState("lobby", new Lobby());
Game.setState("lobby");
