import { GameImage, resolveSpriteRegion, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { ClientPlayer } from "../player/ClientPlayer";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { InGameScene } from "../scene/type/InGameScene";
import { Button, ButtonSize } from "./Button";
import { Label } from "./Label";
import { TechDetailWindow } from "./TechDetailWindow";
import { UITheme } from "./UITheme";

const WINDOW_PADDING = 16;
const TILE_PADDING = 8;
const TILE_ICON_SIZE = 32; // Matches old_java's TechnologyLeaf icon size.
const TILE_WIDTH = 220;
const TILE_GAP = 16; // Horizontal gap between tiles in the same row.
const ROW_GAP = 44; // Vertical gap between tiers.
const SLOT_COUNT = 10; // Fixed columns per row, matching Civ5's tech-web layout - a tech's `slot` (0-9) is its column, not its order among that tier's techs.
const SLOT_WIDTH = TILE_WIDTH + TILE_GAP;
const LOCKED_TRANSPARENCY = 0.4;
const DRAG_THRESHOLD = 4; // Raw mouse movement (px) before a press counts as a drag, not a click.
const PAN_EDGE_MARGIN = 60; // Content can't be dragged past this far off either edge.
const CONNECTOR_MET_COLOR = "lime";
const CONNECTOR_UNMET_COLOR = "#666";
const CONNECTOR_WIDTH = 2;
const ERA_LABEL_MARGIN = 16; // Gap between the grid's edge and an era label outside it.

interface TechData {
  name: string;
  asset_name: string;
  cost: number;
  prerequisites: string[];
  description: string;
  slot: number;
  row: number;
}

interface EraData {
  name: string;
  rows: number[];
}

interface TechTile {
  tech: TechData;
  background: Actor;
  actors: Actor[]; // Everything belonging to this tile - shifted together when panning.
}

// Full-screen research tree, opened from ResearchDisplayInfo's button. Each tech
// carries its own row (0 = bottom) and slot (0-9, its column in a fixed 10-wide
// grid) from techs.yml, matching Civ5's hand-placed tech-web layout rather than
// a position derived from prerequisite depth - two techs can be equally deep in
// the prerequisite graph and still sit in different rows, and a row can have
// deliberately empty slots. Each tile mirrors old_java's compact TechnologyLeaf
// (icon + name only); clicking one opens a TechDetailWindow with the full
// description and Research/Cancel action.
//
// The tree can be wider/taller than the window (25+ techs, several rows deep),
// so content is drag-panned and clipped to the window bounds rather than shrunk
// to fit - keeps tiles a fixed readable size regardless of tech count.
export class ResearchTreeWindow extends ActorGroup {
  private windowBackground: Actor;
  private detailWindow: TechDetailWindow;
  private tiles: TechTile[] = [];
  private tilesByName: Map<string, TechTile> = new Map();
  private eraLabels: Label[] = [];

  private isMouseDown = false;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;

  constructor() {
    super({
      x: 0,
      y: UITheme.STATUS_BAR_HEIGHT,
      z: 6,
      width: Game.getInstance().getWidth(),
      height: Game.getInstance().getHeight() - UITheme.STATUS_BAR_HEIGHT,
      cameraApplies: false
    });

    this.windowBackground = new Actor({
      image: Game.getInstance().getImage(GameImage.POPUP_BOX),
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      nineSlice: true,
      cornerSize: 20
    });
    this.addActor(this.windowBackground);

    this.addActor(
      new Button({
        icon: SpriteRegion.ICON_CANCEL,
        iconOnly: true,
        size: ButtonSize.ICON_SMALL,
        x: this.x + this.width - WINDOW_PADDING - ButtonSize.ICON_SMALL.width,
        y: this.y + WINDOW_PADDING,
        onClicked: () => {
          Game.getInstance().getCurrentSceneAs<InGameScene>().toggleResearchUI();
        }
      })
    );

    this.on("mousedown", (options: { x: number; y: number; button: number }) => {
      if (options.button !== 0 || !this.insideActor(options.x, options.y)) return;

      this.isMouseDown = true;
      this.isDragging = false;
      this.dragStartX = options.x;
      this.dragStartY = options.y;
      this.lastMouseX = options.x;
      this.lastMouseY = options.y;
    });

    this.on("mousemove", (options: { x: number; y: number }) => {
      if (!this.isMouseDown) return;

      const { dx, dy } = this.clampPanDelta(options.x - this.lastMouseX, options.y - this.lastMouseY);
      this.lastMouseX = options.x;
      this.lastMouseY = options.y;

      for (const tile of this.tiles) {
        for (const actor of tile.actors) {
          actor.setPosition(actor.getX() + dx, actor.getY() + dy);
        }
      }
      for (const label of this.eraLabels) {
        label.setPosition(label.getX() + dx, label.getY() + dy);
      }

      if (Math.abs(options.x - this.dragStartX) + Math.abs(options.y - this.dragStartY) > DRAG_THRESHOLD) {
        this.isDragging = true;
      }
    });

    this.on("mouseup", () => {
      this.isMouseDown = false;
    });

    this.on("mouseleave", () => {
      this.isMouseDown = false;
    });

    NetworkEvents.on({
      eventName: "updateAvailableTechs",
      parentObject: this,
      callback: (data) => {
        this.buildTree(data["technologies"], data["eras"]);
      }
    });

    NetworkEvents.on({
      eventName: "updateResearch",
      parentObject: this,
      callback: () => {
        this.refreshLockState();
      }
    });

    WebsocketClient.sendMessage({ event: "requestAvailableTechs" });
  }

  public onDestroyed() {
    super.onDestroyed();
    NetworkEvents.removeCallbacksByParentObject(this);
  }

  // Everything drawn by this window (background, close button, tiles, the detail
  // popup) is clipped to the window's own rect, so panned tiles can't spill out
  // over the status bar or off the screen edge.
  public draw(canvasContext: CanvasRenderingContext2D) {
    canvasContext.save();
    canvasContext.beginPath();
    canvasContext.rect(this.x, this.y, this.width, this.height);
    canvasContext.clip();

    // Explicit order, not super.draw()'s actor-insertion order: background first
    // (it's opaque and would otherwise paint over the lines), then connector
    // lines, then everything else on top (tiles/buttons/detail popup).
    this.windowBackground.draw(canvasContext);

    // Drawn with raw canvas calls (not the Line/Game.drawLine primitive used for
    // map movement paths) - that path always applies the scene's camera
    // transform, which this screen-space, non-camera window must not get.
    this.drawConnectorLines(canvasContext);

    for (const actor of this.actors) {
      if (actor === this.windowBackground) continue;
      actor.draw(canvasContext);
    }

    canvasContext.restore();
  }

  // Recomputed every frame from each tile's current (possibly panned) position and
  // the player's current research state, so lines never need separate upkeep on
  // drag or on updateResearch - they're just derived, not stored, state.
  private drawConnectorLines(canvasContext: CanvasRenderingContext2D) {
    if (this.tiles.length === 0) return;

    const clientPlayer: ClientPlayer = Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer();

    canvasContext.save();
    canvasContext.lineWidth = CONNECTOR_WIDTH;

    for (const tile of this.tiles) {
      const toX = tile.background.getX() + tile.background.getWidth() / 2;
      const toY = tile.background.getY() + tile.background.getHeight();

      for (const prereqName of tile.tech.prerequisites) {
        const prereqTile = this.tilesByName.get(prereqName);
        if (!prereqTile) continue;

        const fromX = prereqTile.background.getX() + prereqTile.background.getWidth() / 2;
        const fromY = prereqTile.background.getY();

        canvasContext.strokeStyle = clientPlayer.hasResearchedTech(prereqName)
          ? CONNECTOR_MET_COLOR
          : CONNECTOR_UNMET_COLOR;
        canvasContext.beginPath();
        canvasContext.moveTo(fromX, fromY);
        canvasContext.lineTo(toX, toY);
        canvasContext.stroke();
      }
    }

    canvasContext.restore();
  }

  private async buildTree(technologies: TechData[], eras: EraData[]) {
    const textMaxWidth = TILE_WIDTH - TILE_PADDING * 2 - TILE_ICON_SIZE - 8;

    // Every tile shares one height (the tallest wrapped name across all techs),
    // so tiles line up in a clean grid instead of each being sized to its own content.
    const nameWraps = await Promise.all(
      technologies.map((tech) => Game.getInstance().getWrappedText(tech.name, UITheme.FONT, textMaxWidth))
    );
    const nameSlotHeight = Math.max(...nameWraps.map(([, height]) => height));
    const tileHeight = TILE_PADDING * 2 + Math.max(TILE_ICON_SIZE, nameSlotHeight);

    const bottomRowY = this.y + this.height - WINDOW_PADDING - tileHeight;
    // One shared grid origin (not per-row) so a given slot lands at the same X in
    // every row - that's what makes the connector lines read as a real tech web
    // instead of a loose scatter, and what leaves unused slots as visible gaps.
    const gridWidth = SLOT_COUNT * TILE_WIDTH + (SLOT_COUNT - 1) * TILE_GAP;
    const gridStartX = this.x + this.width / 2 - gridWidth / 2;

    // row/slot are both hand-authored data (techs.yml), not derived from
    // prerequisite depth - Civ5's actual layout doesn't pack every tech into the
    // shallowest row its prerequisites allow.
    for (const tech of technologies) {
      const tileY = bottomRowY - tech.row * (tileHeight + ROW_GAP);
      const tileX = gridStartX + tech.slot * SLOT_WIDTH;
      this.tiles.push(this.createTechTile(tech, tileX, tileY, tileHeight, textMaxWidth));
    }

    this.buildEraMarkers(eras, bottomRowY, tileHeight, gridStartX, gridWidth);
    this.refreshLockState();
  }

  // A label for each era on the left and right edges of the grid (outside the
  // tile columns entirely), vertically centered across that era's row span -
  // no line runs through the tree itself, so nothing competes with the
  // prerequisite connector lines already drawn there.
  private async buildEraMarkers(eras: EraData[], bottomRowY: number, tileHeight: number, gridStartX: number, gridWidth: number) {
    const rowTopY = (row: number) => bottomRowY - row * (tileHeight + ROW_GAP);
    const rowBottomY = (row: number) => rowTopY(row) + tileHeight;

    for (const era of eras) {
      const minRow = Math.min(...era.rows);
      const maxRow = Math.max(...era.rows);
      const centerY = (rowTopY(maxRow) + rowBottomY(minRow)) / 2 - UITheme.FONT_SIZE / 2;

      const rightLabel = new Label({
        text: era.name,
        font: UITheme.FONT,
        fontColor: "white",
        x: gridStartX + gridWidth + ERA_LABEL_MARGIN,
        y: centerY
      });
      this.addActor(rightLabel);
      this.eraLabels.push(rightLabel);

      // Right-aligned against the grid's left edge, so it needs its own width first.
      const leftLabel = new Label({ text: era.name, font: UITheme.FONT, fontColor: "white", y: centerY });
      await leftLabel.conformSize();
      leftLabel.setPosition(gridStartX - ERA_LABEL_MARGIN - leftLabel.getWidth(), centerY);
      this.addActor(leftLabel);
      this.eraLabels.push(leftLabel);
    }
  }

  private createTechTile(tech: TechData, tileX: number, tileY: number, tileHeight: number, textMaxWidth: number): TechTile {
    const iconRegion = resolveSpriteRegion(tech.asset_name) ?? SpriteRegion.ICON_UNKNOWN;

    const background = new Actor({
      image: Game.getInstance().getImage(GameImage.POPUP_BOX),
      x: tileX,
      y: tileY,
      width: TILE_WIDTH,
      height: tileHeight,
      nineSlice: true,
      cornerSize: 10
    });
    background.on("mouse_enter", () => Game.getInstance().setCursor("pointer"));
    background.on("mouse_exit", () => Game.getInstance().setCursor("default"));
    background.on("clicked", () => {
      if (this.isDragging) return; // A drag ending over a tile shouldn't also open it.
      this.openTechDetail(tech);
    });
    this.addActor(background);

    const iconX = tileX + TILE_PADDING;
    const iconY = tileY + tileHeight / 2 - TILE_ICON_SIZE / 2;
    const icon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: iconRegion,
      x: iconX,
      y: iconY,
      width: TILE_ICON_SIZE,
      height: TILE_ICON_SIZE
    });
    this.addActor(icon);

    const nameLabel = new Label({
      text: tech.name,
      font: UITheme.FONT,
      fontColor: "white",
      maxWidth: textMaxWidth,
      x: iconX + TILE_ICON_SIZE + 8,
      y: tileY + TILE_PADDING
    });
    nameLabel.conformSize().then(() => this.addActor(nameLabel));

    const tile: TechTile = { tech, background, actors: [background, icon, nameLabel] };
    this.tilesByName.set(tech.name, tile);
    return tile;
  }

  // Dims any tile whose prerequisites aren't all researched yet, rather than
  // hiding it - lets the whole tree stay visible so techs further out can be
  // previewed ahead of time. Re-run whenever research state changes.
  private refreshLockState() {
    const clientPlayer: ClientPlayer = Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer();

    for (const tile of this.tiles) {
      const locked = tile.tech.prerequisites.some((prereq) => !clientPlayer.hasResearchedTech(prereq));
      const transparency = locked ? LOCKED_TRANSPARENCY : 1;

      for (const actor of tile.actors) {
        actor.setTransparency(transparency);
      }
    }
  }

  private clampPanDelta(dx: number, dy: number): { dx: number; dy: number } {
    if (this.tiles.length === 0) return { dx: 0, dy: 0 };

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const tile of this.tiles) {
      minX = Math.min(minX, tile.background.getX());
      maxX = Math.max(maxX, tile.background.getX() + tile.background.getWidth());
      minY = Math.min(minY, tile.background.getY());
      maxY = Math.max(maxY, tile.background.getY() + tile.background.getHeight());
    }

    const minDx = this.x + PAN_EDGE_MARGIN - maxX;
    const maxDx = this.x + this.width - PAN_EDGE_MARGIN - minX;
    const minDy = this.y + PAN_EDGE_MARGIN - maxY;
    const maxDy = this.y + this.height - PAN_EDGE_MARGIN - minY;

    return {
      dx: this.clampAxis(dx, minDx, maxDx),
      dy: this.clampAxis(dy, minDy, maxDy)
    };
  }

  // When the content is narrower/shorter than the window (min > max, e.g. a
  // small tier that already fits with margin to spare), no panning is needed
  // on that axis - clamping dx/dy into an inverted range would otherwise
  // collapse every delta to a single constant and send tiles flying.
  private clampAxis(delta: number, min: number, max: number): number {
    if (min > max) return 0;
    return Math.min(Math.max(delta, min), max);
  }

  private openTechDetail(tech: TechData) {
    if (this.detailWindow) {
      this.removeActor(this.detailWindow);
      this.detailWindow = undefined;
    }

    this.detailWindow = new TechDetailWindow(tech, () => {
      this.removeActor(this.detailWindow);
      this.detailWindow = undefined;
    });
    this.addActor(this.detailWindow);
  }
}
