import { Game } from "../../Game";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { Label } from "./Label";
import { Scrollbar } from "./Scrollbar";

export interface SectionListRow {
  height: number;
  // Builds the row's actors at the given spot. Called again each time the row scrolls into view
  // or its section reopens, so it must not hold on to actors from an earlier call.
  create: (x: number, y: number, width: number) => Actor[];
}

export interface SectionListSection {
  // Sections without a title have no header and can't be closed.
  title?: string;
  rows: SectionListRow[];
}

export interface SectionListOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  headerHeight?: number;
  font?: string;
  // Whether a titled section starts closed the first time it's shown.
  startCollapsed?: boolean;
}

// One line of the list once sections are flattened: a section header or one of its rows.
interface SectionListEntry {
  height: number;
  create: (x: number, y: number, width: number) => Actor[];
}

// The clickable bar at the top of a titled section.
class SectionHeader extends Actor {
  private static readonly COLOR = "rgba(0, 0, 0, 0.3)";
  private static readonly HOVER_COLOR = "rgba(0, 0, 0, 0.45)";

  constructor(x: number, y: number, width: number, height: number, onClicked: () => void) {
    super({ x, y, width, height, color: SectionHeader.COLOR, cameraApplies: false });

    this.on("mouse_enter", () => {
      this.color = SectionHeader.HOVER_COLOR;
      Game.getInstance().setCursor("pointer");
    });
    this.on("mouse_exit", () => {
      this.color = SectionHeader.COLOR;
      Game.getInstance().setCursor("default");
    });
    this.on("clicked", onClicked);
  }

  public onDestroyed(): void {
    super.onDestroyed();
    // Clicking a header rebuilds the list under the cursor, so mouse_exit never fires for it.
    if (this.mouseInside) {
      Game.getInstance().setCursor("default");
    }
  }
}

// A scrollable list of sections, each with a header that opens and closes it. Scrolls a whole
// line at a time and only builds the lines that fully fit, so nothing past its edges is ever
// drawn or clickable and no clipping is needed.
export class SectionList extends ActorGroup {
  private static readonly SCROLLBAR_WIDTH = 12;
  private static readonly SCROLLBAR_MARGIN = 8;
  private static readonly HEADER_GAP = 6;

  private headerHeight: number;
  private font: string;
  private startCollapsed: boolean;
  private sections: SectionListSection[] = [];
  // Keyed by section title, so a section stays open or closed across setSections() calls.
  private collapsed = new Map<string, boolean>();
  private entries: SectionListEntry[] = [];
  private entryActors: Actor[] = [];
  private firstVisibleEntry = 0;
  private scrollbar: Scrollbar;
  // "wheel" events carry no cursor position, so the last one seen gates wheel scrolling.
  private lastMouseX = 0;
  private lastMouseY = 0;

  constructor(options: SectionListOptions) {
    super({ x: options.x, y: options.y, width: options.width, height: options.height, cameraApplies: false });

    this.headerHeight = options.headerHeight ?? 40;
    this.font = options.font ?? "20px serif";
    this.startCollapsed = options.startCollapsed ?? false;
    this.scrollbar = new Scrollbar({
      x: this.x + this.width - SectionList.SCROLLBAR_WIDTH - SectionList.SCROLLBAR_MARGIN,
      y: this.y,
      width: SectionList.SCROLLBAR_WIDTH,
      height: this.height,
      onScroll: (value) => this.scrollTo(value)
    });

    this.on("mousemove", (moveOptions: { x: number; y: number }) => {
      this.lastMouseX = moveOptions.x;
      this.lastMouseY = moveOptions.y;
      this.scrollbar.handleMouseMove(moveOptions);
    });

    this.on("mousedown", (downOptions: { x: number; y: number; button: number }) => {
      this.scrollbar.handleMouseDown(downOptions);
    });

    this.on("wheel", (wheelOptions: { deltaY: number }) => {
      if (!this.insideActor(this.lastMouseX, this.lastMouseY)) return;

      this.scrollTo(this.firstVisibleEntry + Math.sign(wheelOptions.deltaY));
    });
  }

  public setSections(sections: SectionListSection[]) {
    this.sections = sections;
    this.rebuild();
  }

  public onDestroyed(): void {
    super.onDestroyed();
    this.scrollbar.stopDragging();
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    super.draw(canvasContext);
    this.scrollbar.draw(canvasContext);
  }

  private isCollapsed(section: SectionListSection): boolean {
    if (!section.title) return false;

    return this.collapsed.get(section.title) ?? this.startCollapsed;
  }

  private toggleSection(section: SectionListSection) {
    this.collapsed.set(section.title, !this.isCollapsed(section));
    this.rebuild();
  }

  // Re-flattens the sections into lines, then rebuilds whichever lines are on screen.
  private rebuild() {
    this.entries = [];
    for (const section of this.sections) {
      if (section.title) {
        this.entries.push(this.createHeaderEntry(section));
      }
      if (!this.isCollapsed(section)) {
        this.entries.push(...section.rows);
      }
    }

    this.scrollbar.setRange(this.getMaxFirstEntry(), this.getVisibleEntryCount(this.firstVisibleEntry));
    this.scrollTo(this.firstVisibleEntry, true);
  }

  private createHeaderEntry(section: SectionListSection): SectionListEntry {
    return {
      height: this.headerHeight + SectionList.HEADER_GAP,
      create: (x, y, width) => {
        const header = new SectionHeader(x, y, width, this.headerHeight, () => this.toggleSection(section));
        const label = new Label({
          text: `${this.isCollapsed(section) ? "▸" : "▾"}  ${section.title}`,
          font: this.font,
          fontColor: "white",
          x: x + 12
        });
        label.conformSize().then(() => {
          label.setPosition(label.getX(), y + this.headerHeight / 2 - label.getHeight() / 2);
        });

        return [header, label];
      }
    };
  }

  private scrollTo(entry: number, forceRender = false) {
    const clamped = Math.max(0, Math.min(Math.round(entry), this.getMaxFirstEntry()));
    if (clamped === this.firstVisibleEntry && !forceRender) return;

    this.firstVisibleEntry = clamped;
    this.scrollbar.setValue(clamped);
    this.renderEntries();
  }

  private renderEntries() {
    for (const actor of this.entryActors) {
      this.removeActor(actor);
    }
    this.entryActors = [];

    // Leaves room for the scrollbar only when there is one.
    const contentWidth = this.scrollbar.isVisible()
      ? this.width - SectionList.SCROLLBAR_WIDTH - SectionList.SCROLLBAR_MARGIN * 2
      : this.width;
    const visibleCount = this.getVisibleEntryCount(this.firstVisibleEntry);

    let y = this.y;
    for (const entry of this.entries.slice(this.firstVisibleEntry, this.firstVisibleEntry + visibleCount)) {
      for (const actor of entry.create(this.x, y, contentWidth)) {
        this.addActor(actor);
        this.entryActors.push(actor);
      }
      y += entry.height;
    }
  }

  // How many lines from `start` onward fit fully on screen (at least one, so a line taller
  // than the whole list still shows).
  private getVisibleEntryCount(start: number): number {
    let usedHeight = 0;
    let count = 0;
    for (const entry of this.entries.slice(start)) {
      if (usedHeight + entry.height > this.height && count > 0) break;

      usedHeight += entry.height;
      count++;
    }

    return Math.max(1, count);
  }

  // The first line to show when scrolled all the way down: the earliest one from which every
  // remaining line still fits.
  private getMaxFirstEntry(): number {
    let usedHeight = 0;
    for (let index = this.entries.length - 1; index >= 0; index--) {
      usedHeight += this.entries[index].height;
      if (usedHeight > this.height) return Math.min(index + 1, this.entries.length - 1);
    }

    return 0;
  }
}
