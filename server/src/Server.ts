import { WebSocketServer } from "ws";
import { ServerEvents } from "./Events";
import { Game } from "./Game";
import { InGameState } from "./state/type/InGameState";
import { LobbyState } from "./state/type/LobbyState";

export class Server {
  private static serverInstance: Server;

  private port: number = 2000;
  private wss: WebSocketServer;
  private connectedIPs: Set<string> = new Set();
  private allowDuplicateIPs: boolean = false;

  /**
   *
   * @returns Server singleton instance
   */
  public static getInstance(): Server {
    if (this.serverInstance == undefined) {
      this.serverInstance = new Server();
    }

    return this.serverInstance;
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
      const ip = request.socket.remoteAddress;
      console.log(`New connection from IP: ${ip}`);

      // Only check for duplicate IPs if not allowed
      if (!this.allowDuplicateIPs && ip && this.connectedIPs.has(ip)) {
        websocket.close(4001, "Multiple connections from same IP are not allowed.");
        console.log(`Connection from IP ${ip} rejected: Multiple connections not allowed.`);
        return;
      }

      if (ip) {
        this.connectedIPs.add(ip);
      }

      websocket.on("close", () => {
        if (ip) this.connectedIPs.delete(ip);
        console.log(`Connection closed from IP: ${ip}`);
      });

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
    Game.getInstance().addState("lobby", new LobbyState());
    Game.getInstance().addState("in_game", new InGameState());
    Game.getInstance().setState("lobby");
  }

  /**
   * Stop the OpenCiv server
   */
  public stop() {
    console.log("Stopping server...");
    this.wss.close();
    process.exit(0);
  }

  public setAllowDuplicateIPs(allow: boolean) {
    this.allowDuplicateIPs = allow;
  }
}

Server.getInstance().setAllowDuplicateIPs(true);
Server.getInstance().start();
