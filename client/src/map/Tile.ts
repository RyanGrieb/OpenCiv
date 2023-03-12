import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { Actor } from "../scene/Actor";

export interface TileOptions {
  tileTypes: string[];
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export class Tile extends Actor {
  private static loadedTileImages = new Map<string, HTMLImageElement>();

  private tileTypes: string[];

  constructor(options: TileOptions) {
    super({
      x: options.x,
      y: options.y,
      width: options.width ?? 32,
      height: options.height ?? 32,
    });
    this.tileTypes = options.tileTypes;
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

  public static async generateImageFromTileTypes(tileTypes: string[]): Promise<HTMLImageElement> {
    let canvas = document.getElementById("auxillary_canvas") as HTMLCanvasElement;

    canvas.width = 32;
    canvas.height = 32;
    canvas.getContext("2d").fillStyle = "rgba(0,0,0,0)";
    canvas.getContext("2d").fillRect(0, 0, canvas.width, canvas.height);

    for (let tileType of tileTypes) {
      const spritesheetImage = Game.getImage(GameImage.SPRITESHEET);
      const spriteRegion = SpriteRegion[tileType.toUpperCase()];
      const spriteX = parseInt(spriteRegion.split(",")[0]) * 32;
      const spriteY = parseInt(spriteRegion.split(",")[1]) * 32;
      canvas.getContext("2d").drawImage(spritesheetImage, spriteX, spriteY, 32, 32, 0, 0, 32, 32);
    }

    //canvas.getContext("2d").globalCompositeOperation = "saturation";
    //canvas.getContext("2d").fillStyle = "hsl(35,35%,35%)";
    //canvas.getContext("2d").fillRect(0, 0, canvas.width, canvas.height);

    let image = new Image();
    image.src = canvas.toDataURL();
    image.width = 32;
    image.height = 32;

    await new Promise((resolve) => {
      image.onload = () => resolve(image);
    });
    return image;
  }
}
