import { Player } from "./player";
import { State } from "./state/state";
import { WebSocket } from "ws";
import { ServerEvents } from "./events";

export class Game {
  private constructor() {}
  private static currentState: State;
  private static states: Map<string, State>;
  private static players: Map<string, Player>;

  public static init() {
    this.states = new Map<string, State>();

    ServerEvents.on({
      eventName: "setState",
      callback: (data: JSON) => {
        this.setState(data["state"]);
      },
    });

    ServerEvents.on({
      eventName: "playerNames",
      callback: (data: JSON, websocket) => {
        const playerNames = Array.from(this.players.keys());
        const requestingPlayerName = this.getPlayerFromWebsocket(websocket)?.getName();
        websocket.send(
          JSON.stringify({
            event: "playerNames",
            names: playerNames,
            requestingName: requestingPlayerName,
          })
        );
      },
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

  public static getPlayers() {
    if (!this.players) {
      this.players = new Map<string, Player>();
    }

    return this.players;
  }

  public static getPlayerFromWebsocket(websocket: WebSocket) {
    for (const player of this.players.values()) {
      if (player.getWebsocket() === websocket) {
        return player;
      }
    }

    return undefined;
  }
}
