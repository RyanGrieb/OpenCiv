import { ConfigLoader } from "../util/ConfigLoader";

export interface ImprovementData {
  name: string;
  // Absent where no sprite exists yet.
  asset_name?: string;
  required_tech?: string;
}

// Tile improvements from config/improvements.yml. Builders can't construct them
// yet - for now this only feeds the "Enables" list of each tech.
export class Improvement {
  public static getAllImprovementData(): ImprovementData[] {
    return ConfigLoader.load<{ improvements: ImprovementData[] }>("./config/improvements.yml").improvements;
  }
}
