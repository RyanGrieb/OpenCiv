import { Player } from "./player";
import { State } from "./state/state";
import { WebSocket } from "ws";

export class Game {
  private constructor() {}
  private static currentState: State;
  private static states: Map<string, State>;
  private static storedEvents: Map<string, Function[]>;
  private static players: Map<string, Player>;

  public static init() {
    this.states = new Map<string, State>();

    this.on("setState", (data) => {
      this.setState(data["state"]);
    });

    this.on("playerNames", (data, websocket) => {
      const playerNames = Array.from(this.players.keys());
      websocket.send(JSON.stringify({ event: "playerNames", names: playerNames }));
    });
  }

  public static addState(stateName: string, state: State) {
    this.states.set(stateName, state);
  }

  public static setState(stateName: string) {
    const newState = this.states.get(stateName) as State;

    if (this.currentState != null) {
      this.currentState.onDestroyed();
    }

    this.currentState = newState;
    this.currentState.onInitialize();
  }

  /**
   * Stores a callback function to be called when the event is triggered.
   * @param eventName Name of the event.
   * @param callback Function that is called when the event triggers.
   */
  public static on(
    eventName: string,
    callback: (data: Record<string, any>, websocket: WebSocket) => void
  ) {
    if (!this.storedEvents) {
      this.storedEvents = new Map<string, Function[]>();
    }

    //Get the list of stored callback functions or an empty list
    let functions: Function[] = this.storedEvents.get(eventName) ?? [];
    // Append the to functions
    functions.push(callback);
    this.storedEvents.set(eventName, functions);
  }

  public static call(eventName: string, data: Record<string, any>, websocket: WebSocket) {
    if (this.storedEvents.has(eventName)) {
      const functions = this.storedEvents.get(eventName) as Function[];

      //Call the stored callback functions
      for (let currentFunction of functions) {
        currentFunction(data, websocket);
      }
    }
  }

  public static getPlayers() {
    if (!this.players) {
      this.players = new Map<string, Player>();
    }

    return this.players;
  }
}
