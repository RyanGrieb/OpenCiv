import { Player } from "./Player";
import { State } from "./state/State";
import { WebSocket } from "ws";
import { ServerEvents } from "./Events";

import fs from "fs";
import YAML from "yaml";

/**
 * Game class is responsible for managing the state of the game, and players.
 */
export class Game {
  private constructor() {}
  private static currentState: State;
  private static states: Map<string, State>;
  private static players: Map<string, Player>;
  private static cityBuildings: Record<string, any>[];

  /**
   * Initializes the game by setting up server event listeners for various events.
   */
  public static init() {
    this.states = new Map<string, State>();

    // Load available buildings from config file
    const buildingsYMLData = YAML.parse(
      fs.readFileSync("./config/buildings.yml", "utf-8")
    );
    //Convert civsData from YAML to JSON:
    this.cityBuildings = JSON.parse(JSON.stringify(buildingsYMLData.buildings));

    // Set up the listener for the "setState" event. Changes the game-state.
    ServerEvents.on({
      eventName: "setState",
      parentObject: this,
      callback: (data: JSON) => {
        this.setState(data["state"]);
      },
      globalEvent: true,
    });

    // Set up the listener for the "connectedPlayers" event. Return all connected players in-game.
    ServerEvents.on({
      eventName: "connectedPlayers",
      parentObject: this,
      callback: (data: JSON, websocket) => {
        // Get all player names and the name of the requesting player.
        const requestingPlayerName =
          this.getPlayerFromWebsocket(websocket)?.getName();
        // Send the names to the requesting player.
        websocket.send(
          JSON.stringify({
            event: "connectedPlayers",
            players: this.getPlayerJSONS(),
            requestingName: requestingPlayerName,
          })
        );
      },
      globalEvent: true,
    });

    // Set up the listener for the "playerQuit" event.
    ServerEvents.on({
      eventName: "playerQuit",
      parentObject: this,
      callback: (data: JSON) => {
        // If only one player is remaining, set the state to "lobby".
        if (this.players.size <= 1) {
          Game.setState("lobby");
        }
      },
      globalEvent: true,
    });
  }

  /**
   * Adds a state to the states map.
   * @param stateName - The name of the state.
   * @param state - The state object to add.
   */
  public static addState(stateName: string, state: State) {
    this.states.set(stateName, state);
  }

  /**
   * Sets the current state of the game.
   * @param stateName - The name of the state to set.
   */
  public static setState(stateName: string) {
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
  public static getPlayers() {
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
  public static getPlayerFromWebsocket(websocket: WebSocket) {
    for (const player of this.players.values()) {
      if (player.getWebsocket() === websocket) {
        return player;
      }
    }

    return undefined;
  }

  public static getBuildingDataByName(name: string) {
    for (const building of this.cityBuildings) {
      if (
        (building.name as string).toLocaleLowerCase() ===
        name.toLocaleLowerCase()
      ) {
        return building;
      }
    }

    return undefined;
  }

  private static getPlayerJSONS() {
    const playerJSONS = [];

    for (const player of this.players.values()) {
      playerJSONS.push(player.toJSON());
    }

    return playerJSONS;
  }
}
