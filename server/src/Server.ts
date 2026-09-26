import { WebSocketServer } from "ws";
import { ServerEvents } from "./Events";
import { Game } from "./Game";
import { GameOptions } from "./GameOptions";
import { ServerArgs } from "./ServerArgs";
import { InGameState } from "./state/type/InGameState";
import { LobbyState } from "./state/type/LobbyState";
import { City } from "./city/City";
import { PlayerNotifications } from "./notification/PlayerNotifications";

export class Server {
  private static serverInstance: Server;

  private port: number = ServerArgs.DEFAULT_PORT;
  private wss: WebSocketServer;
  private connectedIPs: Set<string> = new Set();
  private allowDuplicateIPs: boolean = false;
  private gameOptionOverrides: Partial<GameOptions> = {};

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
    this.listen();
  }

  /**
   * Stop the OpenCiv server
   */
  public stop() {
    console.log("Stopping server...");
    this.wss.close();
    process.exit(0);
  }

  public setPort(port: number) {
    this.port = port;
  }

  public setAllowDuplicateIPs(allow: boolean) {
    this.allowDuplicateIPs = allow;
  }

  /**
   * Game options applied on top of the defaults when the game initializes.
   */
  public setGameOptionOverrides(overrides: Partial<GameOptions>) {
    this.gameOptionOverrides = overrides;
  }

  /**
   * Bind the WebSocketServer, retrying on EADDRINUSE.
   * ts-node-dev force-kills the previous process on restart, so the OS can take
   * a moment to release the port before this one can bind it.
   */
  private listen(retriesLeft: number = 10) {
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.once("listening", () => this.onListening());

    this.wss.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && retriesLeft > 0) {
        console.log(`Port ${this.port} still in use, retrying... (${retriesLeft} attempts left)`);
        setTimeout(() => this.listen(retriesLeft - 1), 300);
        return;
      }

      throw err;
    });
  }

  /**
   * Called once the WebSocketServer has successfully bound to the port.
   */
  private onListening() {
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
        PlayerNotifications.refreshAll();
        City.refreshAllCombatStatus();
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
    Game.init(this.gameOptionOverrides);
    Game.getInstance().addState("lobby", new LobbyState());
    Game.getInstance().addState("in_game", new InGameState());
    Game.getInstance().setState("lobby");
  }
}

if (ServerArgs.helpRequested()) {
  console.log(ServerArgs.usage());
  process.exit(0);
}

Server.getInstance().setPort(ServerArgs.parsePort());
Server.getInstance().setAllowDuplicateIPs(true);
Server.getInstance().setGameOptionOverrides(ServerArgs.parseGameOptions());
Server.getInstance().start();
