import { WebSocketServer } from "ws";
import { ServerEvents } from "./Events";
import { Game } from "./Game";
import { InGameState } from "./state/type/InGameState";
import { LobbyState } from "./state/type/LobbyState";

export class Server {
  private static instance: Server = new Server();

  private port: number = 2000;
  private wss: WebSocketServer;

  /**
   *
   * @returns Server singleton instance
   */
  public static getInstance(): Server {
    return this.instance;
  }

  /**
   * Start the OpenCiv server
   */
  public start() {
    /**
     * Create a new instance of WebSocketServer using the defined port.
     */
    this.wss = new WebSocketServer({ port: this.port });

    /**
     * Listen for connection events on the WebSocketServer instance.
     * When a connection is established, listen for message events.
     * Parse the incoming message into JSON and call the corresponding function in ServerEvents module.
     * Call the "connection" function in ServerEvents module with an empty object and the WebSocket object.
     * See: https://stackoverflow.com/questions/71787172/websocket-server-has-massive-delay-in-multiplayer-game
     * for optimization.
     */
    this.wss.on("connection", (websocket, request) => {
      websocket.on("message", (data: string) => {
        console.log("Message: " + data);
        const jsonData = JSON.parse(data);
        ServerEvents.call(jsonData["event"], jsonData, websocket);
      });
      ServerEvents.call("connection", {}, websocket);
    });

    /**
     * Log a message to the console indicating that the server has been initialized.
     */
    console.log("Server initialized on port: " + this.port);

    /**
     * Initialize the game.
     * Add the "lobby" and "in_game" states to the game using instances of LobbyState and InGameState classes.
     * Set the game state to "lobby".
     */
    Game.init();
    Game.addState("lobby", new LobbyState());
    Game.addState("in_game", new InGameState());
    Game.setState("lobby");
  }

  /**
   * Stop the OpenCiv server
   */
  public stop() {
    console.log("Stopping server...");
    this.wss.close();
    process.exit(0);
  }
}

Server.getInstance().start();
