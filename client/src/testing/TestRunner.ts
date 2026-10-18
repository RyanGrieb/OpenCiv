import { RealMouseGuard } from "./RealMouseGuard";

export interface TestStep {
    name: string;
    action: () => Promise<void> | void;
    verification?: () => Promise<boolean> | boolean;
}

export class TestRunner {
    // The scenario window's log stops growing past this share of the screen and scrolls instead.
    private static readonly LOG_MAX_HEIGHT = "40vh";
    // How close to the bottom (in px) counts as following the log, so new lines keep it scrolled down.
    private static readonly FOLLOW_SLACK = 24;

    private steps: TestStep[] = [];
    private scenarioName: string;

    constructor(scenarioName: string) {
        this.scenarioName = scenarioName;
    }

    /**
     * Adds a line to the scenario window's log, like a console: it scrolls down to the new line, unless
     * the player has scrolled up to read something, in which case it stays where they are.
     */
    public static log(message: string, color: string = "white") {
        const logBody = document.getElementById("test-results-log");
        if (!logBody) return;

        const following = logBody.scrollHeight - logBody.scrollTop - logBody.clientHeight <= TestRunner.FOLLOW_SLACK;
        const line = document.createElement("div");
        line.textContent = message;
        line.style.color = color;
        logBody.appendChild(line);
        if (following) logBody.scrollTop = logBody.scrollHeight;
    }

    public addStep(step: TestStep) {
        this.steps.push(step);
    }

    public async run() {
        console.log(`Starting Test Runner for Scenario: ${this.scenarioName}...`);
        const resultsProxy = document.createElement("div");
        resultsProxy.id = "test-results";
        resultsProxy.style.position = "absolute";
        resultsProxy.style.top = "10px";
        resultsProxy.style.right = "10px";
        resultsProxy.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        resultsProxy.style.color = "white";
        resultsProxy.style.padding = "10px";
        resultsProxy.style.fontFamily = "monospace";

        const title = document.createElement("h3");
        title.style.display = "flex";
        title.style.alignItems = "center";
        title.style.gap = "10px";
        title.style.margin = "0 0 10px 0";
        title.style.borderBottom = "1px solid white";
        const titleText = document.createElement("span");
        titleText.textContent = `Scenario: ${this.scenarioName}`;
        titleText.style.flex = "1";
        title.appendChild(titleText);
        title.appendChild(this.createCloseButton(resultsProxy));
        resultsProxy.appendChild(title);
        resultsProxy.appendChild(this.createLogBody());

        document.body.appendChild(resultsProxy);

        const log = (msg: string, color: string = "white") => {
            TestRunner.log(msg, color);
            console.log(`[TEST] ${msg}`);
        };

        // Scenarios hover things themselves; the real cursor moving over the game mustn't undo that.
        RealMouseGuard.hold();

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

        RealMouseGuard.releaseOnNextClick();
        const logBody = document.getElementById("test-results-log");
        if (logBody) logBody.style.pointerEvents = "auto";
    }

    // Where the log lines go. While the scenario runs, clicks pass through it to the map (it still
    // follows the newest line on its own); once the scenario is done, its scrollbar can be used.
    private createLogBody(): HTMLDivElement {
        const logBody = document.createElement("div");
        logBody.id = "test-results-log";
        logBody.style.maxHeight = TestRunner.LOG_MAX_HEIGHT;
        logBody.style.overflowY = "auto";
        logBody.style.pointerEvents = "none";
        return logBody;
    }

    // A span rather than a <button>, which styles.css draws as the game's large framed button.
    // Closing only hides the window; the scenario keeps running and logging to the console.
    // Sandbox scenarios turn off pointer events on the whole window so clicks reach the map under it;
    // the button turns them back on for itself so it can still be clicked.
    private createCloseButton(resultsWindow: HTMLElement): HTMLSpanElement {
        const button = document.createElement("span");
        button.id = "test-results-close";
        button.textContent = "\u00d7";
        button.title = "Close";
        button.style.color = "white";
        button.style.fontSize = "24px";
        button.style.lineHeight = "1";
        button.style.cursor = "pointer";
        button.style.pointerEvents = "auto";
        button.addEventListener("click", () => resultsWindow.remove());
        return button;
    }
}
