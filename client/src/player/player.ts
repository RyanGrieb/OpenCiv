export class Player {
  private name: string;
  constructor() {}

  public getName(): string {
    return this.name;
  }

  public setName(name: string) {
    this.name = name;
  }
}
