export interface UnitOptions {
  name: string;
  attackType?: string;
  defaultMoveDistance?: number;
}

export class Unit {
  private name: string;
  private attackType: string;
  private defaultMoveDistance: number;

  constructor(options: UnitOptions) {
    this.name = options.name;
    this.attackType = options.attackType || "none";
    this.defaultMoveDistance = options.defaultMoveDistance || 2;
  }

  public asJSON() {
    return {
      name: this.name,
      attackType: this.attackType,
    };
  }
}
