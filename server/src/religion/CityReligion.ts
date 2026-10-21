import type { City } from "../city/City";

/**
 * Which religions a city's citizens follow, as in Civ 5: each citizen follows one religion or none.
 * Religious pressure from nearby cities (see Religions.spreadPressure()) builds up here, one tally per
 * religion, and every CONVERSION_PRESSURE of it converts one citizen: a citizen following nothing
 * first, else one from the religion with the most followers. A new citizen is born into the city's
 * majority religion; a lost one is taken from those following nothing first.
 */
export class CityReligion {
  public static readonly CONVERSION_PRESSURE = 60;

  private city: City;
  private followers = new Map<string, number>();
  private pressure = new Map<string, number>();
  // The population the follower counts were last matched to.
  private population: number;

  constructor(city: City, population: number) {
    this.city = city;
    this.population = population;
  }

  // Followers of each religion, by name. Citizens following none aren't listed.
  public getFollowers(): Record<string, number> {
    this.matchPopulation();
    return Object.fromEntries([...this.followers].filter(([, count]) => count > 0));
  }

  public getFollowersOf(religion: string): number {
    this.matchPopulation();
    return this.followers.get(religion) ?? 0;
  }

  public getNonFollowers(): number {
    this.matchPopulation();
    return this.population - this.countFollowers();
  }

  /**
   * The religion the city follows: the one with the most followers, provided they're at least as many
   * as the citizens following none. Its follower belief (and its founder's pantheon) apply here.
   */
  public getMajority(): string | undefined {
    this.matchPopulation();
    return this.findMajority();
  }

  public getPressure(religion: string): number {
    return this.pressure.get(religion) ?? 0;
  }

  // Pressure toward the religion, converting a citizen for each CONVERSION_PRESSURE banked.
  public addPressure(religion: string, amount: number) {
    this.matchPopulation();
    let banked = this.getPressure(religion) + amount;

    while (banked >= CityReligion.CONVERSION_PRESSURE && this.convertOne(religion)) {
      banked -= CityReligion.CONVERSION_PRESSURE;
    }
    // Once everyone follows it, there's no one left to convert and nothing to bank toward.
    this.pressure.set(religion, Math.min(banked, CityReligion.CONVERSION_PRESSURE));
  }

  // Every citizen follows the religion, as its holy city's do once it's founded.
  public convertAll(religion: string) {
    this.matchPopulation();
    this.followers.clear();
    this.followers.set(religion, this.population);
  }

  // Every follower of another religion follows none instead, and the pressure toward the others is
  // gone, as a Great Prophet's spread or an Inquisitor's Remove Heresy leaves a city.
  public removeOthers(religion: string | undefined) {
    this.matchPopulation();
    [...this.followers.keys()].filter((name) => name !== religion).forEach((name) => this.followers.delete(name));
    [...this.pressure.keys()].filter((name) => name !== religion).forEach((name) => this.pressure.delete(name));
  }

  // For the client: who follows what here, and what the city follows.
  public toJSON() {
    return {
      followers: this.getFollowers(),
      nonFollowers: this.getNonFollowers(),
      majority: this.getMajority() ?? null
    };
  }

  private countFollowers(): number {
    return [...this.followers.values()].reduce((total, count) => total + count, 0);
  }

  // One citizen to the religion: someone following nothing, else the biggest other religion's follower.
  private convertOne(religion: string): boolean {
    if (this.population - this.countFollowers() > 0) {
      this.followers.set(religion, (this.followers.get(religion) ?? 0) + 1);
      return true;
    }

    const from = [...this.followers]
      .filter(([name, count]) => name !== religion && count > 0)
      .sort((a, b) => b[1] - a[1])[0];
    if (!from) return false;

    this.followers.set(from[0], from[1] - 1);
    this.followers.set(religion, (this.followers.get(religion) ?? 0) + 1);
    return true;
  }

  // Catches the follower counts up with the city growing or shrinking since they were last looked at.
  private matchPopulation() {
    const population = this.city.getPopulation();
    if (population > this.population) this.addCitizens(population - this.population);
    if (population < this.population) this.removeCitizens(this.population - population);
    this.population = population;
  }

  private addCitizens(count: number) {
    const majority = this.findMajority();
    if (majority) this.followers.set(majority, (this.followers.get(majority) ?? 0) + count);
  }

  // Those following nothing go first, then the smallest religions' followers.
  private removeCitizens(count: number) {
    let left = count - Math.min(count, this.population - this.countFollowers());
    const smallestFirst = [...this.followers].sort((a, b) => a[1] - b[1]);
    for (const [name, followers] of smallestFirst) {
      const removed = Math.min(left, followers);
      this.followers.set(name, followers - removed);
      left -= removed;
    }
  }

  // The majority by the follower counts as they stand, without matching the population first.
  private findMajority(): string | undefined {
    const ranked = [...this.followers].filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]);
    const top = ranked[0];
    if (!top || top[1] < this.population - this.countFollowers()) return undefined;
    // A tie between two religions leaves the city following neither.
    if (ranked[1] && ranked[1][1] === top[1]) return undefined;

    return top[0];
  }
}
