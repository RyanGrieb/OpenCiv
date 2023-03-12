export class Tile {
  //== Generation Values ==
  private generationHeight: number;
  private generationTemp: number;
  //== Generation Values ==
  private tileTypes: string[];
  private adjacentTiles: Tile[];

  private x: number;
  private y: number;

  constructor(tileType: string, x: number, y: number) {
    this.generationHeight = 0;
    this.generationTemp = 0;

    this.tileTypes = [];
    this.tileTypes.push(tileType);

    this.adjacentTiles = [];

    this.x = x;
    this.y = y;
  }

  public getTileJSON() {
    return { tileTypes: this.tileTypes, x: this.x, y: this.y };
  }

  public addTileType(tileType: string, index?: number) {
    if (tileType === undefined) {
      throw new Error();
    }

    if (this.tileTypes.includes(tileType)) {
      console.log("Warning: Tried to add existing tile type for: " + this.getTileJSON());
      return;
    }

    if (index !== undefined) {
      this.tileTypes.splice(index, 0, tileType);
    } else {
      this.tileTypes.push(tileType);
    }
  }

  public removeTileType(removeType: string) {
    this.tileTypes = this.tileTypes.filter((type) => type != removeType);
  }

  public setAdjacentTile(index: number, tile: Tile) {
    this.adjacentTiles[index] = tile;
  }

  public replaceTileType(oldTileType: string, newTileType: string) {
    this.tileTypes = this.tileTypes.map((type) => (type === oldTileType ? newTileType : type));
  }

  public clearTileTypes() {
    this.tileTypes = [];
  }

  public containsTileType(tileType: string) {
    return this.tileTypes.includes(tileType);
  }

  /**
   *
   * @param tileTypes
   * @returns True if at least ONE provided tileType is inside this tile.
   */
  public containsTileTypes(tileTypes: string[]) {
    for (let i = 0; i < this.tileTypes.length; i++) {
      if (tileTypes.includes(this.tileTypes[i]))
        return true;
    }
    return false;
  }

  public containsAllTileTypes(tileTypes: string[]) {
    return tileTypes.every((tileType) => this.tileTypes.includes(tileType));
  }

  public getAdjacentTiles() {
    return this.adjacentTiles;
  }

  public setGenerationHeight(generationHeight: number) {
    this.generationHeight = generationHeight;
  }

  public setGenerationTemp(generationTemp: number) {
    this.generationTemp = generationTemp;
  }

  public getGenerationTemp() {
    return this.generationTemp;
  }

  public getGenerationHeight() {
    return this.generationHeight;
  }

  public getTileTypes() {
    return this.tileTypes;
  }

  public getX() {
    return this.x;
  }

  public getY() {
    return this.y;
  }
}
