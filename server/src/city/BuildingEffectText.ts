import type { BuildingEffectsData, TileYieldEffect } from "./BuildingEffects";

/**
 * What a building's effects (see BuildingEffectsData) do, in the words its tooltip shows, e.g.
 * "+25% Gold" or "+1 Food on sea tiles". Kept apart from BuildingEffects so Building can use it without
 * pulling in the game state BuildingEffects reads.
 */
export class BuildingEffectText {
  public static describe(effects: BuildingEffectsData): string[] {
    const lines: string[] = [];

    for (const [stat, amount] of Object.entries(effects.yields_per_citizen ?? {})) {
      lines.push(`+1 ${BuildingEffectText.statName(stat)} per ${Math.round(1 / amount)} citizens`);
    }
    for (const [stat, percent] of Object.entries(effects.yield_percent ?? {})) {
      lines.push(`${BuildingEffectText.signed(percent)}% ${BuildingEffectText.statName(stat)}`);
    }
    for (const [stat, percent] of Object.entries(effects.empire_yield_percent ?? {})) {
      lines.push(`${BuildingEffectText.signed(percent)}% ${BuildingEffectText.statName(stat)} in all cities`);
    }
    (effects.tile_yields ?? []).forEach((effect) => lines.push(BuildingEffectText.describeTileYield(effect)));

    if (effects.unit_production) {
      lines.push(`+${effects.unit_production.percent}% Production toward ${effects.unit_production.label}`);
    }
    if (effects.food_kept_percent) lines.push(`Keeps ${effects.food_kept_percent}% of its Food after growing`);
    if (effects.free_techs)
      lines.push(BuildingEffectText.count(effects.free_techs, "free Technology", "free Technologies"));
    BuildingEffectText.describeFreeUnits(effects.free_units ?? []).forEach((line) => lines.push(line));
    if (effects.copy_land_units) lines.push("A free copy of each land military unit you have");
    if (effects.free_building) lines.push(`A free ${effects.free_building} in the city`);
    if (effects.builder_speed_percent) lines.push(`Builders work ${effects.builder_speed_percent}% faster`);
    if (effects.naval_movement) lines.push(`+${effects.naval_movement} Movement for ships`);
    if (effects.naval_sight) lines.push(`+${effects.naval_sight} Sight for ships`);
    if (effects.friendly_territory_combat_percent) {
      lines.push(`+${effects.friendly_territory_combat_percent}% Combat Strength for units in your territory`);
    }
    if (effects.city_attack_percent) {
      lines.push(`+${effects.city_attack_percent}% Combat Strength for units attacking cities`);
    }
    if (effects.border_cost_percent) {
      lines.push(`Borders grow with ${Math.abs(effects.border_cost_percent)}% less Culture in all cities`);
    }
    if (effects.enemy_movement_cost) {
      lines.push(`Enemy land units spend ${effects.enemy_movement_cost} extra Movement per tile in your territory`);
    }

    return lines;
  }

  // "+1 Food and +1 Production on Desert tiles (not Floodplains)", "+1 Production on Horses, Sheep and Cattle"
  private static describeTileYield(effect: TileYieldEffect): string {
    const yields = BuildingEffectText.joinWords(
      Object.entries(effect.stats).map(
        ([stat, value]) => `${BuildingEffectText.signed(value)} ${BuildingEffectText.statName(stat)}`
      )
    );
    const where = effect.resources
      ? BuildingEffectText.joinWords(effect.resources.map((resource) => BuildingEffectText.capitalize(resource)))
      : `${BuildingEffectText.capitalize(effect.terrain ?? "")} tiles`;
    const except = effect.except?.length
      ? ` (not ${BuildingEffectText.joinWords(effect.except.map((type) => BuildingEffectText.capitalize(type)))})`
      : "";

    return `${yields} on ${where}${except}`;
  }

  // ["Builder", "Builder", "Spearman"] -> ["2 free Builders", "A free Spearman"]
  private static describeFreeUnits(unitNames: string[]): string[] {
    const counts = new Map<string, number>();
    unitNames.forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1));

    return Array.from(counts.entries()).map(([name, amount]) =>
      BuildingEffectText.count(amount, `free ${name}`, `free ${name}s`)
    );
  }

  private static count(amount: number, singular: string, plural: string): string {
    return amount === 1 ? `A ${singular}` : `${amount} ${plural}`;
  }

  private static signed(value: number): string {
    return value > 0 ? `+${value}` : `${value}`;
  }

  private static statName(stat: string): string {
    return BuildingEffectText.capitalize(stat);
  }

  private static capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  // ["a"] -> "a", ["a", "b", "c"] -> "a, b and c"
  private static joinWords(words: string[]): string {
    if (words.length < 2) return words.join("");
    return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
  }
}
