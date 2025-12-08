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
