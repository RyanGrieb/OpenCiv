import { Player } from "./Player";
import { State } from "./state/State";
import { WebSocket } from "ws";
import { ServerEvents } from "./Events";
import { DefaultGameOptions, GameOptionDefinitions, GameOptions } from "./GameOptions";
import { Numbers } from "./util/Numbers";

/**
 * Game class is responsible for managing the state of the game, and players.
 */
export class Game {
  private static gameInstance: Game;

  private currentState: State;
  private states: Map<string, State>;
  private players: Map<string, Player>;
  private gameOptions: GameOptions;

  private constructor(optionOverrides: Partial<GameOptions>) {
    this.states = new Map<string, State>();
    this.gameOptions = { ...DefaultGameOptions, ...optionOverrides };

    // Set up the listener for the "setState" event. Changes the game-state.
    ServerEvents.on({
      eventName: "setState",
      parentObject: this,
      callback: (data) => {
        this.setState(data["state"]);
      },
      globalEvent: true
    });

    // Set up the listener for the "connectedPlayers" event. Return all connected players in-game.
    ServerEvents.on({
      eventName: "connectedPlayers",
      parentObject: this,
      callback: (data, websocket) => {
        // Get all player names and the name of the requesting player.
        const requestingPlayerName = this.getPlayerFromWebsocket(websocket)?.getName();
        // Send the names to the requesting player.
        websocket.send(
          JSON.stringify({
            event: "connectedPlayers",
            players: this.getPlayerJSONS(),
            requestingName: requestingPlayerName
          })
        );
      },
      globalEvent: true
    });

    // Set up the listener for the "playerQuit" event.
    ServerEvents.on({
      eventName: "playerQuit",
      parentObject: this,
      callback: (data) => {
        // If only one player is remaining, set the state to "lobby".
        if (this.players.size <= 1) {
          this.setState("lobby");
        }
      },
      globalEvent: true
    });

    // Set up the listener for the "gameOptions" event. Returns the available options (definition + current
    // value for each) to the requesting player - the client renders its UI from this alone, it never
    // hardcodes which options exist.
    ServerEvents.on({
      eventName: "gameOptions",
      parentObject: this,
      callback: (data, websocket) => {
        this.getPlayerFromWebsocket(websocket)?.sendNetworkEvent({
          event: "gameOptions",
          options: this.getGameOptionsPayload()
        });
      },
      globalEvent: true
    });

    // Set up the listener for the "setGameOption" event. Updates a game option and broadcasts the new
    // options to every connected player - persists on this singleton (rather than the current State) so
    // it survives the lobby -> in_game state transition.
    ServerEvents.on({
      eventName: "setGameOption",
      parentObject: this,
      callback: (data) => {
        const option = data["option"] as keyof GameOptions;
        const definition = GameOptionDefinitions.find((def) => def.key === option);
        let value = data["value"];

        if (definition?.type === "number") {
          value = Numbers.clamp(value, definition.min, definition.max);
        }

        this.setGameOption(option, value);

        if (definition?.type === "number") {
          definition.onChange?.(this.gameOptions, value);
        }

        this.getPlayers().forEach((player) => {
          player.sendNetworkEvent({ event: "gameOptions", options: this.getGameOptionsPayload() });
        });
      },
      globalEvent: true
    });
  }

  public static getInstance() {
    return this.gameInstance;
  }

  /**
   * Initializes the game by setting up server event listeners for various events.
   * @param optionOverrides - Game options set from the server's startup arguments, applied over the defaults.
   */
  public static init(optionOverrides: Partial<GameOptions> = {}) {
    this.gameInstance = new Game(optionOverrides);
  }

  /**
   * Adds a state to the states map.
   * @param stateName - The name of the state.
   * @param state - The state object to add.
   */
  public addState(stateName: string, state: State) {
    this.states.set(stateName, state);
  }

  /**
   * Sets the current state of the game.
   * @param stateName - The name of the state to set.
   */
  public setState(stateName: string) {
    const newState = this.states.get(stateName) as State;

    if (this.currentState != null) {
      this.currentState.onDestroyed();
    }

    this.currentState = newState;
    this.currentState.onInitialize();
  }

  /**
   * Returns the map containing all the players in the game.
   * Creates a new map if it doesn't exist.
   */
  public getPlayers() {
    if (!this.players) {
      this.players = new Map<string, Player>();
    }

    return this.players;
  }

  /**
   * Returns the player object associated with a websocket.
   * @param websocket - The websocket to check.
   * @returns - The player object associated with the websocket or undefined if not found.
   */
  public getPlayerFromWebsocket(websocket: WebSocket) {
    for (const player of this.players.values()) {
      if (player.getWebsocket() === websocket) {
        return player;
      }
    }

    return undefined;
  }

  public getCurrentStateAs<T extends State>(): T {
    return this.currentState as T;
  }

  public getGameOptions(): GameOptions {
    return this.gameOptions;
  }

  // A plain `this.gameOptions[key] = value` doesn't typecheck once GameOptions has fields of
  // different types - TS can't prove `value`'s type matches whichever field `key` (typed as the
  // whole keyof union) happens to pick at runtime. Binding K per-call via a generic sidesteps that.
  private setGameOption<K extends keyof GameOptions>(key: K, value: GameOptions[K]) {
    this.gameOptions[key] = value;
  }

  private getPlayerJSONS() {
    const playerJSONS = [];

    for (const player of this.players.values()) {
      playerJSONS.push(player.toJSON());
    }

    return playerJSONS;
  }

  private getGameOptionsPayload() {
    return GameOptionDefinitions.filter((definition) => !definition.hidden).map((definition) => ({
      ...definition,
      value: this.gameOptions[definition.key]
    }));
  }
}
