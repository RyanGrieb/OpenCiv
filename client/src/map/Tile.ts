import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { Unit } from "../Unit";
import { Actor } from "../scene/Actor";
import { Vector } from "../util/Vector";

export interface TileOptions {
  tileTypes: string[];
  x: number;
  y: number;
  riverSides?: boolean[];
  width?: number;
  height?: number;
}

export class Tile extends Actor {
  public static WIDTH = 32;
  public static HEIGHT = 32;

  private static loadedTileImages = new Map<string, HTMLImageElement>();

  private tileTypes: string[];
  private adjacentTiles: Tile[];
  private vectors: Vector[];
  private riverSides: boolean[];
  private units: Unit[];

  private gridX: number;
  private gridY: number;

  constructor(options: TileOptions) {
    super({
      x: options.x,
      y: options.y,
      width: options.width ?? Tile.WIDTH,
      height: options.height ?? Tile.HEIGHT,
    });
    this.tileTypes = options.tileTypes;
    this.adjacentTiles = [];
    this.vectors = [];
    this.riverSides = options.riverSides ?? Array(6).fill(false);
    this.units = [];

    this.gridX = Math.floor(this.x / 32);
    this.gridY = Math.floor(this.y / 25);

    this.initializeVectors();
  }

  public async loadImage() {
    const key = JSON.stringify(this.tileTypes);

    if (Tile.loadedTileImages.has(key)) {
      this.image = Tile.loadedTileImages.get(key);
    } else {
      this.image = await Tile.generateImageFromTileTypes(this.tileTypes);
      Tile.loadedTileImages.set(key, this.image);
    }
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    super.draw(canvasContext);

    /*this.vectors.forEach((vector) => {
      Game.drawRect({
        x: vector.x,
        y: vector.y,
        height: 1,
        width: 1,
        color: "black",
        canvasContext: canvasContext,
      });
    });*/
  }

  public addUnit(unit: Unit) {
    this.units.push(unit);
  }

  public hasRiver(): boolean {
    return this.riverSides.some((side) => side);
  }

  public getRiverSides() {
    return this.riverSides;
  }

  public getNumberedRiverSides(): number[] {
    const numberedSides: number[] = [];
    for (let i = 0; i < this.riverSides.length; i++) {
      if (this.riverSides[i]) numberedSides.push(i);
    }
    return numberedSides;
  }

  public getTileTypes() {
    return this.tileTypes;
  }

  public setTileTypes(tileTypes: string[]) {
    this.tileTypes = tileTypes;
  }

  public getGridX() {
    return this.gridX;
  }

  public getGridY() {
    return this.gridY;
  }

  public static async generateImageFromTileTypes(
    tileTypes: string[]
  ): Promise<HTMLImageElement> {
    let canvas = document.getElementById(
      "auxillary_canvas"
    ) as HTMLCanvasElement;

    canvas.width = Tile.WIDTH;
    canvas.height = Tile.HEIGHT;
    canvas.getContext("2d").fillStyle = "rgba(0,0,0,0)";
    canvas.getContext("2d").fillRect(0, 0, canvas.width, canvas.height);

    //Note: Tile sizes in spritesheet are always 32x32 regardless of anything else.
    for (let tileType of tileTypes) {
      const spritesheetImage = Game.getImage(GameImage.SPRITESHEET);
      const spriteRegion = SpriteRegion[tileType.toUpperCase()];
      const spriteX = parseInt(spriteRegion.split(",")[0]) * 32;
      const spriteY = parseInt(spriteRegion.split(",")[1]) * 32;
      canvas
        .getContext("2d")
        .drawImage(
          spritesheetImage,
          spriteX,
          spriteY,
          32,
          32,
          0,
          0,
          Tile.WIDTH,
          Tile.HEIGHT
        );
    }

    //canvas.getContext("2d").globalCompositeOperation = "saturation";
    //canvas.getContext("2d").fillStyle = "hsl(35,35%,35%)";
    //canvas.getContext("2d").fillRect(0, 0, canvas.width, canvas.height);

    let image = new Image();
    image.src = canvas.toDataURL();
    image.width = Tile.WIDTH;
    image.height = Tile.HEIGHT;

    await new Promise((resolve) => {
      image.onload = () => resolve(image);
    });
    return image;
  }

  public getAdjacentTiles() {
    return this.adjacentTiles;
  }

  public setAdjacentTile(index: number, tile: Tile) {
    this.adjacentTiles[index] = tile;
  }

  public getVectors() {
    return this.vectors;
  }

  private initializeVectors() {
    // Note: The ordering of this matters since we need to form a polygon from these vectors
    this.vectors.push(new Vector(this.x + this.width / 2, this.y + 32)); // Bottom center
    this.vectors.push(new Vector(this.x + 32, this.y + 25)); // Bottom right
    this.vectors.push(new Vector(this.x + 32, this.y + 7)); // Top right
    this.vectors.push(new Vector(this.x + this.width / 2, this.y)); // Top center
    this.vectors.push(new Vector(this.x, this.y + 7)); // Top left
    this.vectors.push(new Vector(this.x, this.y + 25)); // Bottom left
  }

  public getCenterPosition(): [number, number] {
    return [this.x + Tile.WIDTH / 2, this.y + Tile.HEIGHT / 2];
  }

  public getDistanceFrom(x1: number, y1: number) {
    let x2 = this.getCenterPosition()[0];
    let y2 = this.getCenterPosition()[1];
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  public getUnits(): Unit[] {
    return this.units;
  }
}
