import { Game } from "../Game";
import { InGameScene } from "../scene/type/InGameScene";
import { Unit } from "../Unit";
import { City } from "../city/City";

export class AbstractPlayer {
  private name: string;
  private civData: JSON;

  constructor(playerJSON: JSON) {
    this.civData = playerJSON["civData"];
    this.name = playerJSON["name"];
  }

  public static getPlayerByName(name: string) {
    const players = Game.getInstance().getCurrentSceneAs<InGameScene>().getPlayers();
    for (const player of players) {
      if (player.getName() === name) {
        return player;
      }
    }

    return undefined;
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string) {
    this.name = name;
  }

  public getCivilizationData() {
    return this.civData;
  }

  protected units: Unit[] = [];

  public addUnit(unit: Unit) {
    this.units.push(unit);
  }

  public removeUnit(unit: Unit) {
    this.units = this.units.filter((u) => u !== unit);
  }

  public getUnits() {
    return this.units;
  }

  protected cities: City[] = [];

  public addCity(city: City) {
    this.cities.push(city);
  }

  public removeCity(city: City) {
    this.cities = this.cities.filter((c) => c !== city);
  }

  public getCities() {
    return this.cities;
  }
}
