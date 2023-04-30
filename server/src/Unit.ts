export interface UnitOptions {
  type: string;
  attackType?: string;
  defaultMoveDistance?: number;
}

export class Unit {
  private type: string;
  private attackType: string;
  private defaultMoveDistance: number;

  constructor(options: UnitOptions) {
    this.type = options.type;
    this.attackType = options.attackType || "none";
    this.defaultMoveDistance = options.defaultMoveDistance || 2;
  }

  public asJSON() {
    return {
      type: this.type,
    };
  }
}
