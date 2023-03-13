import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { Actor } from "../scene/Actor";
import { Vector } from "../util/Util";

export interface TileOptions {
  tileTypes: string[];
  x: number;
  y: number;
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

  public getTileTypes() {
    return this.tileTypes;
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
    this.vectors.push(new Vector(this.x + this.width / 2, this.y + 32)); // Bottom center
    this.vectors.push(new Vector(this.x + 32, this.y + 24)); // Bottom right
    this.vectors.push(new Vector(this.x + 32, this.y + 8)); // Top right
    this.vectors.push(new Vector(this.x + this.width / 2, this.y)); // Top center

    this.vectors.push(new Vector(this.x, this.y + 8)); // Top left
    this.vectors.push(new Vector(this.x, this.y + 24)); // Bottom left
  }
}
