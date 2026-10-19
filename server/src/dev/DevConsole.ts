import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { Player } from "../Player";
import { GameMap } from "../map/GameMap";
import { Unit } from "../unit/Unit";

/** What a command answers: lines for the console, and, for one waiting on a tile, the command to send back with it. */
export interface DevCommandResult {
  lines: string[];
  pickTile?: string;
}

/**
 * The developer console's commands (the client opens it with `), for trying things out mid-game, on a
 * server launched in developer mode (--dev, or DEV_MODE=true). The client sends what was typed as a
 * devCommand event, with the tile it picked when a command asked for one (pickTile), and shows the lines
 * it gets back in a devCommandResult event.
 */
export class DevConsole {
  private static readonly HELP = [
    "help - lists these commands",
    "units - lists the units that can be spawned",
    "spawn <unit> - spawns a unit of yours on the next tile you left click",
    "reveal - lifts the fog of war for you, for the rest of the game"
  ];

  // Developer mode, set at launch (see ServerArgs.parseDevMode()): off, every command is refused.
  private static enabled = false;

  public static setEnabled(enabled: boolean) {
    DevConsole.enabled = enabled;
    if (enabled) console.log("Developer mode: the dev console's commands are on");
  }

  /** Answers the devCommand event while a game is on. */
  public static listen(parentObject: object) {
    ServerEvents.on({
      eventName: "devCommand",
      parentObject,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        if (!player) return;

        const tile = typeof data["x"] === "number" ? ([data["x"], data["y"]] as [number, number]) : undefined;
        const result = DevConsole.run(player, String(data["text"] ?? ""), tile);
        player.sendNetworkEvent({ event: "devCommandResult", ...result });
      }
    });
  }

  /** Runs a command for a player, on a tile (grid x and y) when it has picked one. */
  public static run(player: Player, text: string, tile?: [number, number]): DevCommandResult {
    if (!DevConsole.enabled) {
      return { lines: ["This server isn't in developer mode, so the console's commands are off."] };
    }

    const [command, ...words] = text.trim().split(/\s+/);
    const argument = words.join(" ");

    switch (command.toLowerCase()) {
      case "":
        return { lines: [] };
      case "help":
        return { lines: DevConsole.HELP };
      case "units":
        return {
          lines: [
            Unit.getAllUnitData()
              .map((unit) => unit.name)
              .join(", ")
          ]
        };
      case "spawn":
        return DevConsole.spawn(player, argument, tile);
      case "reveal":
        player.getVisibility().revealAll();
        return { lines: ["The whole map is revealed."] };
      default:
        return { lines: [`Unknown command "${command}". Type help for the list.`] };
    }
  }

  private static spawn(player: Player, unitName: string, at?: [number, number]): DevCommandResult {
    if (!unitName) return { lines: ["Usage: spawn <unit>, for example spawn Archer"] };

    const data = Unit.getUnitYMLTypeDataByName(unitName);
    if (!data) return { lines: [`No unit is named "${unitName}". Type units for the list.`] };
    if (!at) return { lines: [`Left click a tile to place the ${data.name}.`], pickTile: `spawn ${data.name}` };

    const tile = GameMap.getInstance().getTiles()[at[0]]?.[at[1]];
    if (!tile) return { lines: ["That's off the map."] };
    if (!Unit.canStandOn(data.name, tile)) {
      return { lines: [`The ${data.name} can't stand there. Pick another tile.`], pickTile: `spawn ${data.name}` };
    }
    if (!tile.canPlaceUnit(player, data.is_utility ?? false)) {
      return { lines: [`The ${data.name} can't share that tile. Pick another.`], pickTile: `spawn ${data.name}` };
    }

    Unit.spawn(data.name, tile, player);
    return { lines: [`Spawned the ${data.name} at ${tile.getX()},${tile.getY()}.`] };
  }
}
