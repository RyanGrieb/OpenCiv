import { Game } from "../Game";
import { TestRunner } from "./TestRunner";

export type ScenarioSetup = (game: Game) => TestRunner;

type ScenarioLoader = () => Promise<ScenarioSetup>;

export class ScenarioRegistry {
    private static scenarios: Map<string, ScenarioLoader> = new Map();

    public static register(name: string, loader: ScenarioLoader) {
        this.scenarios.set(name, loader);
    }

    public static get(name: string): ScenarioLoader | undefined {
        return this.scenarios.get(name);
    }

    public static getAvailableScenarios(): string[] {
        return Array.from(this.scenarios.keys());
    }
}

// Register default scenarios
ScenarioRegistry.register("CitySettlement", async () => {
    const module = await import("./scenarios/CitySettlement.test");
    return module.setupCitySettlementTest;
});

ScenarioRegistry.register("UnitStacking", async () => {
    const module = await import("./scenarios/UnitStacking.test");
    return module.setupUnitStackingTest;
});

ScenarioRegistry.register("UnitStackingProduction", async () => {
    const module = await import("./scenarios/UnitStackingProduction.test");
    return module.setupUnitStackingProductionTest;
});

ScenarioRegistry.register("MeleeCombat", async () => {
    const module = await import("./scenarios/MeleeCombat.test");
    return module.setupMeleeCombatTest;
});

ScenarioRegistry.register("RangedCombat", async () => {
    const module = await import("./scenarios/RangedCombat.test");
    return module.setupRangedCombatTest;
});

ScenarioRegistry.register("CombatSandbox", async () => {
    const module = await import("./scenarios/CombatSandbox.test");
    return module.setupCombatSandboxTest;
});

ScenarioRegistry.register("TechDetailWindow", async () => {
    const module = await import("./scenarios/TechDetailWindow.test");
    return module.setupTechDetailWindowTest;
});

ScenarioRegistry.register("BarbarianCamps", async () => {
    const module = await import("./scenarios/BarbarianCamps.test");
    return module.setupBarbarianCampsTest;
});

ScenarioRegistry.register("BuilderImprovements", async () => {
    const module = await import("./scenarios/BuilderImprovements.test");
    return module.setupBuilderImprovementsTest;
});

ScenarioRegistry.register("BuilderSandbox", async () => {
    const module = await import("./scenarios/BuilderSandbox.test");
    return module.setupBuilderSandboxTest;
});

ScenarioRegistry.register("Notifications", async () => {
    const module = await import("./scenarios/Notifications.test");
    return module.setupNotificationsTest;
});

ScenarioRegistry.register("AllTechsResearched", async () => {
    const module = await import("./scenarios/AllTechsResearched.test");
    return module.setupAllTechsResearchedTest;
});

ScenarioRegistry.register("BorderExpansion", async () => {
    const module = await import("./scenarios/BorderExpansion.test");
    return module.setupBorderExpansionTest;
});
