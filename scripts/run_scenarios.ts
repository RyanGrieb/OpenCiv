import { ChildProcess, spawn } from "child_process";
import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import { chromium, Browser } from "playwright";
import { DevPorts } from "./DevPorts";

// Runs the client's browser scenarios headless and exits non-zero if any fail, for CI:
//
//   npm run test:scenarios                                   # every scenario
//   npm run test:scenarios -- --scenario=MeleeCombat,Diplomacy
//   npm run test:scenarios -- --shard=2/4 --retries=1
//
// It boots a TEST_MODE server and the client dev server on --server-port / --client-port
// (default 2300 / 1300, away from `npm start` and `npm run try`), then opens each scenario's
// ?test=true&scenario=<Name> URL in headless Chromium and waits for TestRunner's final console line.

const ROOT = path.resolve(__dirname, "..");
const REGISTRY = path.join(ROOT, "client/src/testing/ScenarioRegistry.ts");
const PASSED_LINE = "[TEST] ALL TESTS PASSED";
const FAILED_PREFIX = "[TEST] TEST FAILED";
// Deprecated scenarios: still in the scenario list to run by hand, or here by name with --scenario, but
// left out of a run of every scenario (and so out of CI). GlobeDepth checks the globe's look on a random
// map, which made it too flaky headless.
const NOT_IN_FULL_RUN = ["GlobeDepth"];

interface Options {
    scenarios: string[];
    shard: { index: number; count: number };
    retries: number;
    timeoutMs: number;
}

interface ScenarioResult {
    name: string;
    passed: boolean;
    attempts: number;
    seconds: number;
    detail: string;
}

class ScenarioCli {
    // Names in registration order, read from the source so no browser is needed to list them.
    public static allScenarios(): string[] {
        const source = fs.readFileSync(REGISTRY, "utf8");
        return [...source.matchAll(/ScenarioRegistry\.register\("([^"]+)"/g)].map((match) => match[1]);
    }

    public static parse(argv: string[]): Options {
        const options: Options = {
            scenarios: this.allScenarios().filter((name) => !NOT_IN_FULL_RUN.includes(name)),
            shard: { index: 1, count: 1 },
            retries: 0,
            timeoutMs: 180_000
        };

        for (const arg of argv) {
            const [flag, value] = arg.split("=", 2);
            if (flag === "--scenario") {
                options.scenarios = value.split(",");
            } else if (flag === "--shard") {
                const [index, count] = value.split("/").map(Number);
                options.shard = { index, count };
            } else if (flag === "--retries") {
                options.retries = Number(value);
            } else if (flag === "--timeout") {
                options.timeoutMs = Number(value) * 1000;
            }
        }

        const { index, count } = options.shard;
        options.scenarios = options.scenarios.filter((_, i) => i % count === index - 1);
        return options;
    }
}

class ScenarioServers {
    private processes: ChildProcess[] = [];

    public start(ports: { server: number; client: number }) {
        // Developer mode, for the DevConsole scenario.
        const env = { ...process.env, ...DevPorts.env(ports), TEST_MODE: "true", DEV_MODE: "true" };
        const server = spawn("npx", ["ts-node", "--transpile-only", "src/Server.ts"], {
            cwd: path.join(ROOT, "server"),
            env,
            stdio: ["ignore", "ignore", "inherit"],
            detached: true
        });
        const client = spawn("npm", ["run", "dev"], {
            cwd: path.join(ROOT, "client"),
            env,
            stdio: "ignore",
            detached: true
        });
        this.processes.push(server, client);
    }

    public stop() {
        for (const child of this.processes) {
            try {
                process.kill(-child.pid, "SIGTERM");
            } catch {
                // Already gone.
            }
        }
    }

    public static async waitForHttp(url: string, timeoutMs: number) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const ok = await new Promise<boolean>((resolve) => {
                http.get(url, (res) => resolve(res.statusCode === 200)).on("error", () => resolve(false));
            });
            if (ok) return;
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
        throw new Error(`${url} didn't come up within ${timeoutMs / 1000}s`);
    }

    public static async waitForPort(port: number, timeoutMs: number) {
        const deadline = Date.now() + timeoutMs;
        while (await DevPorts.isFree(port)) {
            if (Date.now() > deadline) throw new Error(`Nothing listened on port ${port} within ${timeoutMs / 1000}s`);
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }
}

class ScenarioRun {
    constructor(
        private browser: Browser,
        private clientUrl: string,
        private timeoutMs: number
    ) {}

    // One attempt in a fresh browser context; resolves with the line that ended it.
    public async attempt(name: string): Promise<{ passed: boolean; detail: string }> {
        const context = await this.browser.newContext({ viewport: { width: 1280, height: 720 } });
        const page = await context.newPage();
        const lastLines: string[] = [];

        const outcome = new Promise<{ passed: boolean; detail: string }>((resolve) => {
            page.on("console", (message) => {
                const text = message.text();
                if (!text.startsWith("[TEST]")) return;
                lastLines.push(text);
                if (text === PASSED_LINE) resolve({ passed: true, detail: "" });
                if (text.startsWith(FAILED_PREFIX)) resolve({ passed: false, detail: text });
            });
            page.on("pageerror", (error) => lastLines.push(`[pageerror] ${error.message}`));
            setTimeout(() => resolve({ passed: false, detail: `timed out after ${this.timeoutMs / 1000}s` }), this.timeoutMs);
        });

        await page.goto(`${this.clientUrl}/?test=true&scenario=${name}`);
        const result = await outcome;
        await context.close();

        if (!result.passed) {
            result.detail = [result.detail, ...lastLines.slice(-8).map((line) => `    ${line}`)].join("\n");
        }
        return result;
    }
}

(async () => {
    const { ports, rest } = DevPorts.parse(
        ["--server-port=2300", "--client-port=1300", ...process.argv.slice(2)]
    );
    const options = ScenarioCli.parse(rest);
    const clientUrl = `http://localhost:${ports.client}`;
    const servers = new ScenarioServers();
    process.on("SIGINT", () => {
        servers.stop();
        process.exit(130);
    });

    console.log(`Running ${options.scenarios.length} scenarios (shard ${options.shard.index}/${options.shard.count})`);
    servers.start(ports);

    const results: ScenarioResult[] = [];
    let browser: Browser | undefined;
    try {
        await ScenarioServers.waitForPort(ports.server, 120_000);
        await ScenarioServers.waitForHttp(clientUrl, 120_000);

        // SwiftShader gives headless Chromium a software WebGL, since CI runners have no GPU.
        browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
        const run = new ScenarioRun(browser, clientUrl, options.timeoutMs);

        for (const name of options.scenarios) {
            const started = Date.now();
            let attempts = 0;
            let result = { passed: false, detail: "" };
            while (attempts <= options.retries && !result.passed) {
                attempts++;
                result = await run.attempt(name);
            }
            const seconds = Math.round((Date.now() - started) / 1000);
            const status = !result.passed ? "FAIL " : attempts > 1 ? "FLAKY" : "PASS ";
            console.log(`${status} ${name} (${seconds}s)${result.detail ? `\n${result.detail}` : ""}`);
            results.push({ name, passed: result.passed, attempts, seconds, detail: result.detail });
        }
    } finally {
        await browser?.close();
        servers.stop();
    }

    const failed = results.filter((result) => !result.passed);
    const flaky = results.filter((result) => result.passed && result.attempts > 1);
    console.log(`\n${results.length - failed.length}/${results.length} passed`);
    if (flaky.length > 0) console.log(`Passed only on retry: ${flaky.map((result) => result.name).join(", ")}`);
    if (failed.length > 0) console.log(`Failed: ${failed.map((result) => result.name).join(", ")}`);
    process.exit(failed.length > 0 ? 1 : 0);
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
