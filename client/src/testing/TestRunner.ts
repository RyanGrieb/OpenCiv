import { Game } from "../Game";

export interface TestStep {
    name: string;
    action: () => Promise<void> | void;
    verification?: () => Promise<boolean> | boolean;
}

export class TestRunner {
    private steps: TestStep[] = [];
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    public addStep(step: TestStep) {
        this.steps.push(step);
    }

    public async run() {
        console.log("Starting Test Runner...");
        const resultsProxy = document.createElement("div");
        resultsProxy.id = "test-results";
        resultsProxy.style.position = "absolute";
        resultsProxy.style.top = "10px";
        resultsProxy.style.right = "10px";
        resultsProxy.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        resultsProxy.style.color = "white";
        resultsProxy.style.padding = "10px";
        resultsProxy.style.fontFamily = "monospace";
        document.body.appendChild(resultsProxy);

        const log = (msg: string, color: string = "white") => {
            const line = document.createElement("div");
            line.textContent = msg;
            line.style.color = color;
            resultsProxy.appendChild(line);
            console.log(`[TEST] ${msg}`);
        };

        try {
            for (const step of this.steps) {
                log(`Running: ${step.name}...`);

                await step.action();

                // Wait a bit for processing if needed?
                await new Promise(resolve => setTimeout(resolve, 500));

                if (step.verification) {
                    const result = await step.verification();
                    if (!result) {
                        log(`FAILED: ${step.name}`, "red");
                        throw new Error(`Verification failed for step: ${step.name}`);
                    }
                }
                log(`PASSED: ${step.name}`, "green");
            }
            log("ALL TESTS PASSED", "lime");
        } catch (e) {
            log(`TEST FAILED: ${e}`, "red");
            console.error(e);
        }
    }
}
