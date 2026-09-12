import { Game } from "../Game";
import { InGameScene } from "../scene/type/InGameScene";
import { Unit } from "../Unit";
import { City } from "../city/City";

// Matches server/config/civilizations.yml
export interface CivilizationData {
  name: string;
  icon_name: string;
  inside_border_color: string;
  outside_border_color: string;
  start_bias: string;
  start_bias_desc: string;
  unique_unit_descs: string[];
  unique_building_descs?: string[];
  ability_descs: string[];
  cities: string[];
}

export interface PlayerData {
  name: string;
  civData: CivilizationData;
  requestedNextTurn?: boolean;
}

export class AbstractPlayer {
  private name: string;
  private civData: CivilizationData;

  constructor(playerJSON: PlayerData) {
    this.civData = playerJSON.civData;
    this.name = playerJSON.name;
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
