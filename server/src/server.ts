import { WebSocketServer } from "ws";

const port = 2000; //TODO: This will be assigned by the server indexer.
const wss = new WebSocketServer({ port });

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    console.log("Message: " + data);
  });

  ws.send("You connected");
});

console.log("Listening at " + port);
