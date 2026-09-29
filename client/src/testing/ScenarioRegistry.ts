import { Game } from "../Game";
import { TestRunner } from "./TestRunner";

export type ScenarioSetup = (game: Game) => TestRunner;

type ScenarioLoader = () => Promise<ScenarioSetup>;

// Declaration order is the order the main menu's scenario list shows the categories in.
export enum ScenarioCategory {
    CITIES = "Cities",
    UNITS = "Units",
    ECONOMY = "Economy",
    COMBAT = "Combat",
    DIPLOMACY = "Diplomacy",
    NAVAL = "Naval",
    MAP = "Map",
    RESEARCH = "Research",
    INTERFACE = "Interface"
}

interface ScenarioEntry {
    category: ScenarioCategory;
    loader: ScenarioLoader;
}

export class ScenarioRegistry {
    private static scenarios: Map<string, ScenarioEntry> = new Map();

    public static register(name: string, category: ScenarioCategory, loader: ScenarioLoader) {
        this.scenarios.set(name, { category, loader });
    }

    public static get(name: string): ScenarioLoader | undefined {
        return this.scenarios.get(name)?.loader;
    }

    public static getAvailableScenarios(): string[] {
        return Array.from(this.scenarios.keys());
    }

    // Every category with at least one scenario, in ScenarioCategory order, each with its scenario names.
    public static getScenariosByCategory(): Map<ScenarioCategory, string[]> {
        const grouped = new Map<ScenarioCategory, string[]>();
        for (const category of Object.values(ScenarioCategory)) {
            const names = this.getAvailableScenarios().filter((name) => this.scenarios.get(name).category === category);
            if (names.length > 0) {
                grouped.set(category, names);
            }
        }
        return grouped;
    }

    // Reloads the page onto ?test=true&scenario=<name>, so a scenario picked from the main menu starts
    // exactly like one opened by URL: from a fresh client, and re-run by a browser refresh.
    public static launch(name: string) {
        const params = new URLSearchParams(window.location.search);
        params.set("test", "true");
        params.set("scenario", name);
        window.location.search = params.toString();
    }
}

// Register default scenarios
ScenarioRegistry.register("CitySettlement", ScenarioCategory.CITIES, async () => {
    const module = await import("./scenarios/CitySettlement.test");
    return module.setupCitySettlementTest;
});

ScenarioRegistry.register("UnitStacking", ScenarioCategory.UNITS, async () => {
    const module = await import("./scenarios/UnitStacking.test");
    return module.setupUnitStackingTest;
});

ScenarioRegistry.register("UnitStackingProduction", ScenarioCategory.UNITS, async () => {
    const module = await import("./scenarios/UnitStackingProduction.test");
    return module.setupUnitStackingProductionTest;
});

ScenarioRegistry.register("MeleeCombat", ScenarioCategory.COMBAT, async () => {
    const module = await import("./scenarios/MeleeCombat.test");
    return module.setupMeleeCombatTest;
});

ScenarioRegistry.register("RangedCombat", ScenarioCategory.COMBAT, async () => {
    const module = await import("./scenarios/RangedCombat.test");
    return module.setupRangedCombatTest;
});

ScenarioRegistry.register("CityCombat", ScenarioCategory.COMBAT, async () => {
    const module = await import("./scenarios/CityCombat.test");
    return module.setupCityCombatTest;
});

ScenarioRegistry.register("CitySpacing", ScenarioCategory.CITIES, async () => {
    const module = await import("./scenarios/CitySpacing.test");
    return module.setupCitySpacingTest;
});

ScenarioRegistry.register("CombatSandbox", ScenarioCategory.COMBAT, async () => {
    const module = await import("./scenarios/CombatSandbox.test");
    return module.setupCombatSandboxTest;
});

ScenarioRegistry.register("AncientRuins", ScenarioCategory.MAP, async () => {
    const module = await import("./scenarios/AncientRuins.test");
    return module.setupAncientRuinsTest;
});

ScenarioRegistry.register("TechDetailWindow", ScenarioCategory.RESEARCH, async () => {
    const module = await import("./scenarios/TechDetailWindow.test");
    return module.setupTechDetailWindowTest;
});

ScenarioRegistry.register("BarbarianCamps", ScenarioCategory.COMBAT, async () => {
    const module = await import("./scenarios/BarbarianCamps.test");
    return module.setupBarbarianCampsTest;
});

ScenarioRegistry.register("BuilderImprovements", ScenarioCategory.UNITS, async () => {
    const module = await import("./scenarios/BuilderImprovements.test");
    return module.setupBuilderImprovementsTest;
});

ScenarioRegistry.register("BuilderSandbox", ScenarioCategory.UNITS, async () => {
    const module = await import("./scenarios/BuilderSandbox.test");
    return module.setupBuilderSandboxTest;
});

ScenarioRegistry.register("Notifications", ScenarioCategory.INTERFACE, async () => {
    const module = await import("./scenarios/Notifications.test");
    return module.setupNotificationsTest;
});

ScenarioRegistry.register("AllTechsResearched", ScenarioCategory.RESEARCH, async () => {
    const module = await import("./scenarios/AllTechsResearched.test");
    return module.setupAllTechsResearchedTest;
});

ScenarioRegistry.register("ObsoleteUnits", ScenarioCategory.RESEARCH, async () => {
    const module = await import("./scenarios/ObsoleteUnits.test");
    return module.setupObsoleteUnitsTest;
});

ScenarioRegistry.register("TechEffects", ScenarioCategory.RESEARCH, async () => {
    const module = await import("./scenarios/TechEffects.test");
    return module.setupTechEffectsTest;
});

ScenarioRegistry.register("Wonders", ScenarioCategory.CITIES, async () => {
    const module = await import("./scenarios/Wonders.test");
    return module.setupWondersTest;
});

ScenarioRegistry.register("BorderExpansion", ScenarioCategory.CITIES, async () => {
    const module = await import("./scenarios/BorderExpansion.test");
    return module.setupBorderExpansionTest;
});

ScenarioRegistry.register("AquaticResources", ScenarioCategory.NAVAL, async () => {
    const module = await import("./scenarios/AquaticResources.test");
    return module.setupAquaticResourcesTest;
});

ScenarioRegistry.register("AquaticSandbox", ScenarioCategory.NAVAL, async () => {
    const module = await import("./scenarios/AquaticSandbox.test");
    return module.setupAquaticSandboxTest;
});

ScenarioRegistry.register("TileVariants", ScenarioCategory.MAP, async () => {
    const module = await import("./scenarios/TileVariants.test");
    return module.setupTileVariantsTest;
});

ScenarioRegistry.register("ForestVariety", ScenarioCategory.MAP, async () => {
    const module = await import("./scenarios/ForestVariety.test");
    return module.setupForestVarietyTest;
});

ScenarioRegistry.register("NaturalWonders", ScenarioCategory.MAP, async () => {
    const module = await import("./scenarios/NaturalWonders.test");
    return module.setupNaturalWondersTest;
});

ScenarioRegistry.register("SoftFogOfWar", ScenarioCategory.MAP, async () => {
    const module = await import("./scenarios/SoftFogOfWar.test");
    return module.setupSoftFogOfWarTest;
});

ScenarioRegistry.register("CoastlineBlending", ScenarioCategory.MAP, async () => {
    const module = await import("./scenarios/CoastlineBlending.test");
    return module.setupCoastlineBlendingTest;
});

ScenarioRegistry.register("TerrainBlending", ScenarioCategory.MAP, async () => {
    const module = await import("./scenarios/TerrainBlending.test");
    return module.setupTerrainBlendingTest;
});

ScenarioRegistry.register("Diplomacy", ScenarioCategory.DIPLOMACY, async () => {
    const module = await import("./scenarios/Diplomacy.test");
    return module.setupDiplomacyTest;
});

ScenarioRegistry.register("GoldSpending", ScenarioCategory.ECONOMY, async () => {
    const module = await import("./scenarios/GoldSpending.test");
    return module.setupGoldSpendingTest;
});
