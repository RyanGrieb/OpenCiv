import { GameImage, resolveSpriteRegion, SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { ClientPlayer } from "../../player/ClientPlayer";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { InGameScene } from "../../scene/type/InGameScene";
import { Numbers } from "../../util/Numbers";
import { Button, ButtonSize } from "../components/Button";
import { Label } from "../components/Label";
import { TechBonusTooltip } from "./TechBonusTooltip";
import { TechDetailData, TechDetailWindow } from "./TechDetailWindow";
import { Tooltip } from "../components/Tooltip";
import { UITheme } from "../UITheme";

const WINDOW_PADDING = 16;
// Base (100% zoom) tile geometry - actual layout scales these by zoomLevel.
const BASE_TILE_PADDING = 8;
const BASE_TILE_ICON_SIZE = 56; // The tech's own icon, centered on the tile's left side as in Civ5.
const BASE_TILE_ICON_GAP = 10; // Between the tech's icon and its name and bonus row.
const BASE_BONUS_ICON_SIZE = 32;
const BASE_BONUS_ICON_GAP = 4;
const BONUS_ROW_FITS = 6; // The most bonus icons a tech has (Bronze Working), sized into the tile's width.
const BASE_TILE_WIDTH =
  BASE_TILE_PADDING * 3 +
  BASE_TILE_ICON_SIZE +
  BASE_TILE_ICON_GAP +
  BONUS_ROW_FITS * (BASE_BONUS_ICON_SIZE + BASE_BONUS_ICON_GAP);
const BASE_NAME_GAP = 4; // Between the name and the bonus row under it.
const BASE_SLOT_GAP = 12; // Vertical gap between tiles in the same column.
const BASE_COLUMN_GAP = 48; // Horizontal gap between columns, where the connector lines bend.
const BASE_ERA_LABEL_MARGIN = 8; // Space above and below the era labels over the columns.
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.1;
const LOCKED_TRANSPARENCY = 0.4;
const DRAG_THRESHOLD = 4; // Raw mouse movement (px) before a press counts as a drag, not a click.
const PAN_EDGE_MARGIN = 60; // Content can't be dragged past this far off either edge.
const CONNECTOR_MET_COLOR = "lime";
const CONNECTOR_UNMET_COLOR = "#666";
const CONNECTOR_WIDTH = 2;
const ICON_BACKDROP_COLOR = "rgba(0, 0, 0, 0.35)";
const ICON_RING_COLOR = "rgba(255, 255, 255, 0.25)";
const TOOLTIP_OFFSET = 4; // Between a hovered bonus icon and the tooltip under it.

interface TechData extends TechDetailData {
  slot: number;
  row: number;
}

interface EraData {
  name: string;
  rows: number[];
}

interface TechTile {
  tech: TechData;
  background: Actor; // Hit-testing/position only - never drawn; its transparency doubles as the tile's locked-state alpha.
  bitmap?: HTMLCanvasElement; // The tile's background, icons and name pre-rendered once per build; undefined until its label is measured.
}

// Which bonus icon the mouse is over, so its tooltip is only rebuilt when that changes.
interface HoveredBonus {
  tile: TechTile;
  index: number;
}

// Every size that scales with zoomLevel, computed once per (re)build and threaded
// through instead of each method reading zoomLevel/BASE_* constants itself.
interface TreeLayout {
  tileWidth: number;
  columnGap: number;
  slotGap: number;
  iconSize: number;
  bonusIconSize: number;
  bonusIconGap: number;
  textX: number; // Where the name and the bonus row start, from the tile's left edge.
  tileHeight: number;
  tilePadding: number;
  eraLabelMargin: number;
  font: string;
}

// Full-screen research tree, opened from ResearchDisplayInfo's button. Laid out like
// Civ5's: the first techs on the left and later ones to the right. Each tech carries
// its own row (its column here, 0 = leftmost) and slot (0-9, top to bottom) from
// techs.yml, matching Civ5's hand-placed tech-web layout rather than a position
// derived from prerequisite depth - two techs can be equally deep in the
// prerequisite graph and still sit in different columns, and a column can have
// deliberately empty slots. Each tile is a Civ5 tech button: the tech's large icon
// on the left, its name along the top, and a row of icons for what it gives
// (units, buildings, wonders, improvements, its notes) along the bottom, each with
// a tooltip on hover. Clicking one opens a TechDetailWindow with the full
// description and Research/Cancel action.
//
// The tree can be wider/taller than the window (80 techs, 17 columns wide),
// so content is drag-panned and clipped to the window bounds rather than shrunk
// to fit - keeps tiles a fixed readable size regardless of tech count. The mouse
// wheel adjusts zoomLevel, which rebuilds the whole tree at the new scale rather
// than applying a canvas transform - keeps click hit-testing (checked against
// each tile's actual stored bounds) correct for free, with no separate transform
// bookkeeping needed for input.
export class ResearchTreeWindow extends ActorGroup {
  private windowBackground: Actor;
  private closeButton: Button;
  private detailWindow: TechDetailWindow;
  private tiles: TechTile[] = [];
  private tilesByName: Map<string, TechTile> = new Map();
  private eraLabels: Label[] = [];
  private layout: TreeLayout | undefined;
  private hoveredBonus: HoveredBonus | undefined;
  private bonusTooltip: Tooltip | undefined;

  private isMouseDown = false;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private hoverX = 0;
  private hoverY = 0;

  // Accumulated drag pan, applied on top of the (re)computed grid every build -
  // tracked explicitly (rather than left as implicit actor-position drift) so a
  // zoom change can read and adjust it to keep the point under the cursor fixed.
  private panX = 0;
  private panY = 0;
  private zoomLevel = 1;
  // Cached so a zoom change can rebuild the tree without a round trip to the server.
  private lastTechnologies: TechData[] = [];
  private lastEras: EraData[] = [];
  // Bumped on every (re)build; a build only applies its results if it's still the
  // most recent one requested, so rapid-fire wheel events can't race each other
  // and leave stale tiles added after a newer rebuild already cleared the tree.
  private buildRequestId = 0;

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

    this.closeButton = new Button({
      icon: SpriteRegion.ICON_CANCEL,
      iconOnly: true,
      size: ButtonSize.ICON_SMALL,
      x: this.x + this.width - WINDOW_PADDING - ButtonSize.ICON_SMALL.width,
      y: this.y + WINDOW_PADDING,
      onClicked: () => {
        Game.getInstance().getCurrentSceneAs<InGameScene>().toggleResearchUI();
      }
    });
    this.addActor(this.closeButton);

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
      this.hoverX = options.x;
      this.hoverY = options.y;

      if (!this.isMouseDown) {
        this.updateBonusTooltip();
        return;
      }
      this.hideBonusTooltip();

      const { dx, dy } = this.clampPanDelta(options.x - this.lastMouseX, options.y - this.lastMouseY);
      this.lastMouseX = options.x;
      this.lastMouseY = options.y;
      this.panX += dx;
      this.panY += dy;

      for (const tile of this.tiles) {
        tile.background.setPosition(tile.background.getX() + dx, tile.background.getY() + dy);
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
      this.hideBonusTooltip();
    });

    // Rebuilds the whole tree at the new scale rather than transforming the canvas
    // (which would desync click hit-testing, since it's checked against each
    // tile's stored, unscaled bounds) - simpler, and hit-testing stays correct for
    // free since the tiles' actual geometry reflects the current zoom.
    this.on("wheel", (options: { deltaY: number }) => {
      const nextZoom = Numbers.clamp(
        this.zoomLevel + (options.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP),
        MIN_ZOOM,
        MAX_ZOOM
      );
      if (nextZoom === this.zoomLevel) return;

      // Standard "zoom around a point" adjustment: the tree itself already scales
      // around its top-left origin (pivotX, pivotY) - see buildTree - so shrinking pan
      // toward the cursor by the same ratio keeps whatever point is under the
      // cursor visually fixed instead of the view jumping on every tick.
      const ratio = nextZoom / this.zoomLevel;
      const pivotX = this.x + WINDOW_PADDING;
      const pivotY = this.y + WINDOW_PADDING;
      this.panX = this.panX * ratio + (this.hoverX - pivotX) * (1 - ratio);
      this.panY = this.panY * ratio + (this.hoverY - pivotY) * (1 - ratio);

      this.zoomLevel = nextZoom;
      this.rebuildTree();
    });

    NetworkEvents.on({
      eventName: "updateAvailableTechs",
      parentObject: this,
      callback: (data) => {
        this.lastTechnologies = data["technologies"];
        this.lastEras = data["eras"];
        this.rebuildTree();
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
    // lines, then tiles, then the window chrome (close button) and finally the
    // detail popup on top of everything.
    this.windowBackground.draw(canvasContext);

    // Drawn with raw canvas calls (not the Line/Game.drawLine primitive used for
    // map movement paths) - that path always applies the scene's camera
    // transform, which this screen-space, non-camera window must not get.
    this.drawConnectorLines(canvasContext);
    this.drawTiles(canvasContext);

    for (const label of this.eraLabels) {
      label.draw(canvasContext);
    }

    this.closeButton.draw(canvasContext);

    if (this.bonusTooltip) {
      this.bonusTooltip.draw(canvasContext);
    }

    if (this.detailWindow) {
      this.detailWindow.draw(canvasContext);
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

    // One path per color, stroked once, instead of a stroke per edge.
    const metPath = new Path2D();
    const unmetPath = new Path2D();

    // Like Civ5's, each line leaves the prerequisite's right edge, bends in the gap just
    // before the tech's column, and enters the tech's left edge.
    const bendInset = (BASE_COLUMN_GAP * this.zoomLevel) / 2;

    for (const tile of this.tiles) {
      const toX = tile.background.getX();
      const toY = tile.background.getY() + tile.background.getHeight() / 2;
      const bendX = toX - bendInset;

      for (const prereqName of tile.tech.prerequisites) {
        const prereqTile = this.tilesByName.get(prereqName);
        if (!prereqTile) continue;

        const fromX = prereqTile.background.getX() + prereqTile.background.getWidth();
        const fromY = prereqTile.background.getY() + prereqTile.background.getHeight() / 2;
        const path = clientPlayer.hasResearchedTech(prereqName) ? metPath : unmetPath;
        path.moveTo(fromX, fromY);
        path.lineTo(bendX, fromY);
        path.lineTo(bendX, toY);
        path.lineTo(toX, toY);
      }
    }

    canvasContext.strokeStyle = CONNECTOR_UNMET_COLOR;
    canvasContext.stroke(unmetPath);
    canvasContext.strokeStyle = CONNECTOR_MET_COLOR;
    canvasContext.stroke(metPath);

    canvasContext.restore();
  }

  // Blits each tile's pre-rendered bitmap - skipping any wholly outside the window -
  // instead of redrawing its nine-slice, icon and text every frame.
  private drawTiles(canvasContext: CanvasRenderingContext2D) {
    const left = this.x;
    const right = this.x + this.width;
    const top = this.y;
    const bottom = this.y + this.height;

    for (const tile of this.tiles) {
      if (!tile.bitmap) continue;

      const x = Math.round(tile.background.getX());
      const y = Math.round(tile.background.getY());
      if (x + tile.bitmap.width < left || x > right || y + tile.bitmap.height < top || y > bottom) continue;

      canvasContext.globalAlpha = tile.background.getTransparency();
      canvasContext.drawImage(tile.bitmap, x, y);
    }

    canvasContext.globalAlpha = 1;
  }

  // Tears down and rebuilds every tile/label at the current zoomLevel, using
  // whatever tech/era data was last received - used both for the initial build
  // and every zoom change, so the two never drift into different code paths.
  private rebuildTree() {
    this.clearTree();
    this.buildTree();
  }

  private clearTree() {
    this.hideBonusTooltip();
    for (const tile of this.tiles) {
      this.removeActor(tile.background);
    }
    this.tiles = [];
    this.tilesByName = new Map();

    for (const label of this.eraLabels) {
      this.removeActor(label);
    }
    this.eraLabels = [];
  }

  private async buildTree() {
    if (this.lastTechnologies.length === 0) return;

    const requestId = ++this.buildRequestId;
    const zoom = this.zoomLevel;
    const tileWidth = BASE_TILE_WIDTH * zoom;
    const tilePadding = BASE_TILE_PADDING * zoom;
    const iconSize = BASE_TILE_ICON_SIZE * zoom;
    const textX = tilePadding + iconSize + BASE_TILE_ICON_GAP * zoom;
    const font = `${Math.round(UITheme.FONT_SIZE * zoom)}px serif`;
    const textMaxWidth = tileWidth - textX - tilePadding;

    // Every tile shares one height (the tallest wrapped name across all techs),
    // so tiles line up in a clean grid instead of each being sized to its own content.
    const nameWraps = await Promise.all(
      this.lastTechnologies.map((tech) => Game.getInstance().getWrappedText(tech.name, layout.font, textMaxWidth))
    );
    // A newer rebuild (another zoom tick, or fresh data) started while this one was
    // awaiting text measurement - drop these results rather than adding tiles on
    // top of (or instead of) whatever that newer build already produced.
    if (requestId !== this.buildRequestId) return;

    // The name along the top, the bonus row along the bottom.
    const nameSlotHeight = Math.max(...nameWraps.map(([, height]) => height));
    const bonusIconSize = BASE_BONUS_ICON_SIZE * zoom;
    const tileHeight = tilePadding * 2 + Math.max(iconSize, nameSlotHeight + BASE_NAME_GAP * zoom + bonusIconSize);
    const layout: TreeLayout = {
      tileWidth,
      columnGap: BASE_COLUMN_GAP * zoom,
      slotGap: BASE_SLOT_GAP * zoom,
      iconSize,
      bonusIconSize,
      bonusIconGap: BASE_BONUS_ICON_GAP * zoom,
      textX,
      tileHeight,
      tilePadding,
      eraLabelMargin: BASE_ERA_LABEL_MARGIN * zoom,
      font
    };
    this.layout = layout;

    // panX/panY (drag accumulation, adjusted on each zoom to keep the point under
    // the cursor fixed - see the wheel handler) folded in here, once, so every
    // downstream position - tiles and era labels alike - inherits it for free.
    // Everything scales from the top-left origin; the era labels sit in a band above
    // the columns.
    const originX = this.x + WINDOW_PADDING + this.panX;
    const originY = this.y + WINDOW_PADDING + this.panY;
    const eraBandHeight = UITheme.FONT_SIZE * this.zoomLevel + layout.eraLabelMargin * 2;
    const columnX = (row: number) => originX + row * (layout.tileWidth + layout.columnGap);
    const gridTopY = originY + eraBandHeight;

    // row/slot are both hand-authored data (techs.yml), not derived from
    // prerequisite depth - Civ5's actual layout doesn't pack every tech into the
    // shallowest column its prerequisites allow. One shared grid means a given slot
    // lands at the same height in every column, leaving unused slots as visible gaps.
    for (const tech of this.lastTechnologies) {
      const tileX = columnX(tech.row);
      const tileY = gridTopY + tech.slot * (tileHeight + layout.slotGap);
      this.tiles.push(this.createTechTile(tech, tileX, tileY, textMaxWidth, layout, requestId));
    }

    this.buildEraMarkers(this.lastEras, columnX, originY, layout, requestId);
    this.refreshLockState();
  }

  // A label for each era above the tree, centered over that era's columns as in Civ5,
  // so nothing runs through the tree to compete with the connector lines.
  private async buildEraMarkers(
    eras: EraData[],
    columnX: (row: number) => number,
    originY: number,
    layout: TreeLayout,
    requestId: number
  ) {
    for (const era of eras) {
      const left = columnX(Math.min(...era.rows));
      const right = columnX(Math.max(...era.rows)) + layout.tileWidth;

      // Centered, so it needs its own width first.
      const label = new Label({
        text: era.name,
        font: layout.font,
        fontColor: "white",
        y: originY + layout.eraLabelMargin
      });
      await label.conformSize();
      if (requestId !== this.buildRequestId) return; // Superseded mid-measurement - see buildTree.
      label.setPosition((left + right) / 2 - label.getWidth() / 2, originY + layout.eraLabelMargin);
      this.addActor(label);
      this.eraLabels.push(label);
    }
  }

  private createTechTile(
    tech: TechData,
    tileX: number,
    tileY: number,
    textMaxWidth: number,
    layout: TreeLayout,
    requestId: number
  ): TechTile {
    const background = new Actor({
      x: tileX,
      y: tileY,
      width: layout.tileWidth,
      height: layout.tileHeight,
      cameraApplies: false
    });
    background.on("mouse_enter", () => {
      if (this.detailWindow) return; // Tiles aren't clickable while the detail popup is open - see the "clicked" guard below.
      Game.getInstance().setCursor("pointer");
    });
    background.on("mouse_exit", () => Game.getInstance().setCursor("default"));
    background.on("clicked", () => {
      if (this.isDragging || this.detailWindow) return; // A drag ending over a tile shouldn't also open it, and a tile behind the open detail popup shouldn't be clickable through it.
      this.openTechDetail(tech);
    });
    this.addActor(background);

    const tile: TechTile = { tech, background };
    this.tilesByName.set(tech.name, tile);

    const nameLabel = new Label({
      text: tech.name,
      font: layout.font,
      fontColor: "white",
      maxWidth: textMaxWidth,
      x: layout.textX,
      y: layout.tilePadding
    });
    nameLabel.conformSize().then(() => {
      if (requestId !== this.buildRequestId) return; // Superseded mid-measurement - see buildTree.
      tile.bitmap = this.drawTileBitmap(tech, nameLabel, layout);
    });

    return tile;
  }

  // The tile's background, the tech's icon in a dark ring, its name and its bonus row, laid out at the
  // bitmap's own origin rather than the tile's on-screen position.
  private drawTileBitmap(tech: TechData, nameLabel: Label, layout: TreeLayout): HTMLCanvasElement {
    const bitmap = document.createElement("canvas");
    bitmap.width = Math.ceil(layout.tileWidth);
    bitmap.height = Math.ceil(layout.tileHeight);
    const context = bitmap.getContext("2d");

    new Actor({
      image: Game.getInstance().getImage(GameImage.POPUP_BOX),
      x: 0,
      y: 0,
      width: bitmap.width,
      height: bitmap.height,
      nineSlice: true,
      cornerSize: 10,
      cameraApplies: false
    }).draw(context);

    const iconX = layout.tilePadding;
    const iconY = layout.tileHeight / 2 - layout.iconSize / 2;
    const ringRadius = layout.iconSize / 2 + 2 * this.zoomLevel;
    context.beginPath();
    context.arc(iconX + layout.iconSize / 2, iconY + layout.iconSize / 2, ringRadius, 0, Math.PI * 2);
    context.fillStyle = ICON_BACKDROP_COLOR;
    context.fill();
    context.lineWidth = 2 * this.zoomLevel;
    context.strokeStyle = ICON_RING_COLOR;
    context.stroke();
    this.drawSprite(context, tech.asset_name, iconX, iconY, layout.iconSize);

    nameLabel.draw(context);

    // A dark strip under the bonus icons, like Civ5's, running from the name's left edge to the tile's right.
    const rowY = this.bonusRowY(layout);
    const stripInset = 2 * this.zoomLevel;
    context.beginPath();
    context.roundRect(
      layout.textX - stripInset,
      rowY - stripInset,
      layout.tileWidth - layout.tilePadding - layout.textX + stripInset * 2,
      layout.bonusIconSize + stripInset * 2,
      4 * this.zoomLevel
    );
    context.fillStyle = ICON_BACKDROP_COLOR;
    context.fill();

    (tech.bonuses ?? []).forEach((bonus, index) => {
      this.drawSprite(context, bonus.asset_name, this.bonusIconX(layout, index), rowY, layout.bonusIconSize);
    });

    return bitmap;
  }

  private drawSprite(context: CanvasRenderingContext2D, assetName: string, x: number, y: number, size: number) {
    new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: resolveSpriteRegion(assetName) ?? SpriteRegion.ICON_UNKNOWN,
      x,
      y,
      width: size,
      height: size,
      cameraApplies: false
    }).draw(context);
  }

  // Where the bonus row sits in a tile, from the tile's top-left corner.
  private bonusRowY(layout: TreeLayout): number {
    return layout.tileHeight - layout.tilePadding - layout.bonusIconSize;
  }

  private bonusIconX(layout: TreeLayout, index: number): number {
    return layout.textX + index * (layout.bonusIconSize + layout.bonusIconGap);
  }

  // The bonus icon under the mouse, if any.
  private findHoveredBonus(): HoveredBonus | undefined {
    const layout = this.layout;
    if (!layout || this.detailWindow) return undefined;

    for (const tile of this.tiles) {
      const localX = this.hoverX - tile.background.getX();
      const localY = this.hoverY - tile.background.getY();
      const rowY = this.bonusRowY(layout);
      if (localY < rowY || localY > rowY + layout.bonusIconSize) continue;

      const index = Math.floor((localX - layout.textX) / (layout.bonusIconSize + layout.bonusIconGap));
      if (index < 0 || index >= (tile.tech.bonuses ?? []).length) continue;
      if (localX > this.bonusIconX(layout, index) + layout.bonusIconSize) continue; // In the gap between two icons.

      return { tile, index };
    }
    return undefined;
  }

  // Shows the hovered bonus icon's tooltip under it, or hides it once the mouse leaves the icon.
  private async updateBonusTooltip() {
    const hovered = this.findHoveredBonus();
    if (hovered?.tile === this.hoveredBonus?.tile && hovered?.index === this.hoveredBonus?.index) return;

    this.hideBonusTooltip();
    if (!hovered) return;
    this.hoveredBonus = hovered;

    const layout = this.layout;
    const x = hovered.tile.background.getX() + this.bonusIconX(layout, hovered.index);
    const y = hovered.tile.background.getY() + this.bonusRowY(layout) + layout.bonusIconSize + TOOLTIP_OFFSET;
    const tooltip = await TechBonusTooltip.create(x, y, hovered.tile.tech.bonuses[hovered.index]);
    // The mouse moved on to another icon (or off) while this one was being measured.
    if (this.hoveredBonus !== hovered) return;
    this.bonusTooltip = tooltip;
  }

  private hideBonusTooltip() {
    this.hoveredBonus = undefined;
    this.bonusTooltip = undefined;
  }

  // Dims any tile whose prerequisites aren't all researched yet, rather than
  // hiding it - lets the whole tree stay visible so techs further out can be
  // previewed ahead of time. Re-run whenever research state changes.
  private refreshLockState() {
    const clientPlayer: ClientPlayer = Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer();

    for (const tile of this.tiles) {
      const locked = tile.tech.prerequisites.some((prereq) => !clientPlayer.hasResearchedTech(prereq));
      tile.background.setTransparency(locked ? LOCKED_TRANSPARENCY : 1);
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

  public getDetailWindow(): TechDetailWindow | undefined {
    return this.detailWindow;
  }

  public openTechDetailByName(techName: string): boolean {
    const tech = this.lastTechnologies.find((candidate) => candidate.name === techName);
    if (tech) this.openTechDetail(tech);
    return tech !== undefined;
  }

  private openTechDetail(tech: TechData) {
    if (this.detailWindow) {
      this.removeActor(this.detailWindow);
      this.detailWindow = undefined;
    }

    this.hideBonusTooltip();
    this.detailWindow = new TechDetailWindow({
      tech,
      allTechs: this.lastTechnologies,
      onClose: () => {
        this.removeActor(this.detailWindow);
        this.detailWindow = undefined;
      },
      onOpenTech: (techName) => this.openTechDetailByName(techName)
    });
    this.addActor(this.detailWindow);
  }
}
