import { ClientSettings } from "../../ClientSettings";
import { Game } from "../../Game";
import { Tile } from "../../map/Tile";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Actor } from "../../scene/Actor";
import { Scrollbar } from "../components/Scrollbar";
import { UITheme } from "../UITheme";

/**
 * The developer console, opened and closed with `: a strip under the status bar with its output,
 * scrolled to the newest lines (the wheel, the scrollbar or Page Up and Down go back), over a line to
 * type into. The map doesn't zoom or pan under it. What's typed is sent to the server, which runs it (see the
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
  private static readonly SCROLLBAR_WIDTH = 12;
  // Output kept, in wrapped lines; older lines are dropped.
  private static readonly MAX_LINES = 500;

  // Output in lines that fit across the console.
  private readonly output: string[] = [];
  // The index in `output` of the top line shown.
  private firstShownLine = 0;
  private readonly scrollbar: Scrollbar;
  // "wheel" events carry no cursor position, so the last one seen says whether the wheel is over it.
  private mouseX = 0;
  private mouseY = 0;
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

    const outputTop = this.y + DevConsole.PADDING;
    this.scrollbar = new Scrollbar({
      x: this.x + this.width - DevConsole.SCROLLBAR_WIDTH - DevConsole.PADDING,
      y: outputTop,
      width: DevConsole.SCROLLBAR_WIDTH,
      height: DevConsole.SHOWN_LINES * DevConsole.LINE_HEIGHT,
      onScroll: (value) => this.scrollTo(value)
    });
    this.print("Type help for the list of commands.");

    this.on("mousemove", (options: { x: number; y: number }) => {
      this.mouseX = options.x;
      this.mouseY = options.y;
      this.scrollbar.handleMouseMove(options);
      // Holding the map still under it, so the wheel and dragging are the console's.
      this.holdMap(this.insideActor(options.x, options.y));
    });
    this.on("mousedown", (options: { x: number; y: number; button: number }) => {
      this.scrollbar.handleMouseDown(options);
    });
    this.on("wheel", (options: { deltaY: number }) => {
      if (!this.insideActor(this.mouseX, this.mouseY)) return;
      this.scrollTo(this.firstShownLine + Math.sign(options.deltaY) * 3);
    });

    NetworkEvents.on<{ lines: string[]; pickTile?: string }>({
      eventName: "devCommandResult",
      parentObject: this,
      callback: (data) => {
        data.lines.forEach((line) => this.print(line));
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
      this.scrollbar.stopDragging();
      this.holdMap(false);
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
    const shown = this.output.slice(this.firstShownLine, this.firstShownLine + DevConsole.SHOWN_LINES);
    // Until there's enough to fill it, the newest output sits just above the input line.
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
    this.scrollbar.draw(canvasContext);
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.key === DevConsole.TOGGLE_KEY || event.key === "Escape") {
      this.toggle();
      return;
    }

    // Not the browser's own uses of these keys, like ' opening quick find. F5 and F12 still work.
    if (
      event.key.length === 1 ||
      ["Backspace", "Tab", "ArrowUp", "ArrowDown", "PageUp", "PageDown"].includes(event.key)
    ) {
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
      case "PageUp":
        this.scrollTo(this.firstShownLine - DevConsole.SHOWN_LINES);
        return;
      case "PageDown":
        this.scrollTo(this.firstShownLine + DevConsole.SHOWN_LINES);
        return;
    }
    // Typed characters only: named keys (Shift, F5, ArrowLeft) have longer names.
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) this.input += event.key;
  }

  private submit() {
    const text = this.input.trim();
    this.input = "";
    if (!text) return;

    this.print(DevConsole.PROMPT + text);
    this.history.push(text);
    this.historyIndex = this.history.length;
    // A new command drops a tile the last one was still waiting on.
    this.pendingTileCommand = undefined;
    WebsocketClient.sendMessage({ event: "devCommand", text });
  }

  // Adds a line of output, wrapped to fit, scrolling down to it if the newest lines were showing.
  private print(text: string) {
    const following = this.firstShownLine >= this.lastFirstLine();
    this.output.push(...this.wrap(text));
    const dropped = Math.max(0, this.output.length - DevConsole.MAX_LINES);
    this.output.splice(0, dropped);

    this.scrollbar.setRange(this.lastFirstLine(), DevConsole.SHOWN_LINES);
    this.scrollTo(following ? this.lastFirstLine() : this.firstShownLine - dropped);
  }

  // A line of text broken into lines that fit beside the scrollbar, between words where it can.
  private wrap(text: string): string[] {
    const maxWidth = this.width - 3 * DevConsole.PADDING - DevConsole.SCROLLBAR_WIDTH;
    const fits = (line: string) => Game.getInstance().measureText(line, DevConsole.FONT).width <= maxWidth;
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(" ")) {
      const longer = line ? `${line} ${word}` : word;
      if (fits(longer) || !line) {
        line = longer;
        continue;
      }
      lines.push(line);
      line = word;
    }
    lines.push(line);
    return lines;
  }

  private lastFirstLine() {
    return Math.max(0, this.output.length - DevConsole.SHOWN_LINES);
  }

  private scrollTo(line: number) {
    this.firstShownLine = Math.round(Math.max(0, Math.min(this.lastFirstLine(), line)));
    this.scrollbar.setValue(this.firstShownLine);
  }

  // Locks the camera while the mouse is over the console, and unlocks it once it's left or closed.
  private holdMap(hold: boolean) {
    const camera = Game.getInstance().getCurrentScene().getCamera();
    if (camera.isLocked() !== hold) camera.lock(hold);
  }

  // Steps back (-1) or forward (1) through what was entered before, as a shell does.
  private recall(step: number) {
    this.historyIndex = Math.max(0, Math.min(this.history.length, this.historyIndex + step));
    this.input = this.history[this.historyIndex] ?? "";
  }
}
