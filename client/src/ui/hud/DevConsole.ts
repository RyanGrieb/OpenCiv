import { ClientSettings } from "../../ClientSettings";
import { Game } from "../../Game";
import { Tile } from "../../map/Tile";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Actor } from "../../scene/Actor";
import { UITheme } from "../UITheme";

/**
 * The developer console, opened and closed with `: a strip under the status bar with the last few
 * lines of output over a line to type into. What's typed is sent to the server, which runs it (see the
 * server's DevConsole) and answers with lines to show. A command that needs a tile, like spawn, has
 * the next left click on the map pick it, with the console open or not.
 */
export class DevConsole extends Actor {
  public static readonly TOGGLE_KEY = "`";
  private static readonly FONT = `${UITheme.FONT_SIZE}px monospace`;
  private static readonly LINE_HEIGHT = UITheme.FONT_SIZE + 6;
  private static readonly SHOWN_LINES = 8;
  private static readonly PADDING = 8;
  private static readonly PROMPT = "> ";

  private readonly output: string[] = ["Type help for the list of commands."];
  private readonly history: string[] = [];
  // How far back through the history Up has gone: history.length when it's at the line being typed.
  private historyIndex = 0;
  private input = "";
  private open = false;
  // The command to send again with the next tile left clicked, for one that asked for a tile.
  private pendingTileCommand: string | undefined;

  constructor() {
    super({
      x: 0,
      y: UITheme.STATUS_BAR_HEIGHT,
      z: 20,
      width: Game.getInstance().getWidth(),
      height: (DevConsole.SHOWN_LINES + 1) * DevConsole.LINE_HEIGHT + 2 * DevConsole.PADDING,
      cameraApplies: false
    });

    NetworkEvents.on<{ lines: string[]; pickTile?: string }>({
      eventName: "devCommandResult",
      parentObject: this,
      callback: (data) => {
        this.output.push(...data.lines);
        this.pendingTileCommand = data.pickTile;
      }
    });
  }

  public isOpen() {
    return this.open;
  }

  /** Shows it and gives it the keyboard, or hides it and gives the keyboard back. */
  public toggle() {
    this.open = !this.open;
    const scene = Game.getInstance().getCurrentScene();
    if (this.open) {
      scene.addActor(this);
      Game.getInstance().setKeyCapture((event) => this.onKeyDown(event));
    } else {
      scene.removeActor(this);
      Game.getInstance().setKeyCapture(undefined);
    }
  }

  /** Hands a left-clicked tile to the command waiting on one: true if there was one, so the click goes no further. */
  public useTileClick(tile: Tile | undefined): boolean {
    if (!this.pendingTileCommand || !tile) return false;

    WebsocketClient.sendMessage({
      event: "devCommand",
      text: this.pendingTileCommand,
      x: tile.getGridX(),
      y: tile.getGridY()
    });
    this.pendingTileCommand = undefined;
    return true;
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    const game = Game.getInstance();
    game.drawRect({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      color: "black",
      fill: true,
      transparency: ClientSettings.get("HUD_TRANSPARENCY"),
      canvasContext
    });

    const lineHeight = DevConsole.LINE_HEIGHT;
    const textX = this.x + DevConsole.PADDING;
    const top = this.y + DevConsole.PADDING;
    const shown = this.output.slice(-DevConsole.SHOWN_LINES);
    // The newest output sits just above the input line.
    const firstY = top + (DevConsole.SHOWN_LINES - shown.length) * lineHeight;
    shown.forEach((line, index) => {
      game.drawText(
        { text: line, font: DevConsole.FONT, color: "white", x: textX, y: firstY + index * lineHeight },
        canvasContext
      );
    });

    const inputY = top + DevConsole.SHOWN_LINES * lineHeight;
    const blinkOn = Math.floor(performance.now() / 500) % 2 === 0;
    const inputLine = DevConsole.PROMPT + this.input + (blinkOn ? "_" : "");
    game.drawText({ text: inputLine, font: DevConsole.FONT, color: "white", x: textX, y: inputY }, canvasContext);
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.key === DevConsole.TOGGLE_KEY || event.key === "Escape") {
      this.toggle();
      return;
    }

    // Not the browser's own uses of these keys, like ' opening quick find. F5 and F12 still work.
    if (event.key.length === 1 || ["Backspace", "Tab", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
    }
    switch (event.key) {
      case "Enter":
        this.submit();
        return;
      case "Backspace":
        this.input = this.input.slice(0, -1);
        return;
      case "ArrowUp":
        this.recall(-1);
        return;
      case "ArrowDown":
        this.recall(1);
        return;
    }
    // Typed characters only: named keys (Shift, F5, ArrowLeft) have longer names.
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) this.input += event.key;
  }

  private submit() {
    const text = this.input.trim();
    this.input = "";
    if (!text) return;

    this.output.push(DevConsole.PROMPT + text);
    this.history.push(text);
    this.historyIndex = this.history.length;
    // A new command drops a tile the last one was still waiting on.
    this.pendingTileCommand = undefined;
    WebsocketClient.sendMessage({ event: "devCommand", text });
  }

  // Steps back (-1) or forward (1) through what was entered before, as a shell does.
  private recall(step: number) {
    this.historyIndex = Math.max(0, Math.min(this.history.length, this.historyIndex + step));
    this.input = this.history[this.historyIndex] ?? "";
  }
}
