import concurrently from "concurrently";
import { execFileSync, execSync } from "child_process";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline/promises";
import { DevPorts } from "./DevPorts";
import { WorktreeProcesses } from "./WorktreeProcesses";

// Fetches a branch into its own git worktree, installs what changed, and starts it on free ports,
// leaving your own checkout untouched:
//
//   npm run try                          # the most recently pushed claude/* branch
//   npm run try -- claude/some-thread    # a specific branch (the "origin/" prefix is optional)
//   npm run try -- claude/some-thread --scenario=CombatSandbox   # open the browser straight into a test scenario
//   npm run try -- --list                # recent claude/* branches, newest first
//   npm run try -- --stop                # stop every branch that's still running
//   npm run try -- --clean               # stop them and delete every worktree this made
//   npm run approve                      # fast-forward master to the tried branch, then delete it
//
// Approve pushes the exact commit you tried (the branch's worktree), and refuses if the branch has
// moved since or master can't fast-forward to it. To deny, don't approve - reply in the thread.
//
// Worktrees live in ../OpenCiv-branches/ and are reused, so a second try of the same branch just
// moves it to the latest push and skips npm install unless a lockfile changed. A new worktree hard-links
// node_modules from your checkout or another worktree, and installs only when none has the same lockfile.
// Any other arguments go to the server as game options, like with start:ports.
//
// A branch's server and client are stopped when you press Ctrl+C or close the terminal, and before the same branch
// is tried again. Anything that still escapes is found by its worktree path, which --stop and --clean look for.

const ROOT = path.resolve(__dirname, "..");
const WORKTREES = path.resolve(ROOT, "..", "OpenCiv-branches");
const INSTALL_STAMP = ".try-install-hash";
const LOCKFILES = ["package-lock.json", "client/package-lock.json", "server/package-lock.json"];

class TryBranch {
  // Runs git directly rather than through a shell, so a branch name or path is always one argument and never shell.
  public static git(args: string[], cwd = ROOT): string {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
  }

  public static recentBranches(): string[] {
    const refs = this.git([
      "for-each-ref",
      "--sort=-committerdate",
      "--format=%(refname:short)|%(committerdate:relative)",
      "refs/remotes/origin/claude"
    ]);
    return refs ? refs.split("\n") : [];
  }

  // dir is a project folder (server/ or client/) inside a worktree. A new worktree borrows node_modules from your
  // own checkout or another worktree, hard-linked so it costs neither disk nor much time, and only runs npm install
  // when no copy matches its lockfile. Even then it starts from the closest copy, so npm only fetches what changed.
  public static installIfChanged(dir: string): void {
    const hash = this.lockfileHash(dir);
    const nodeModules = path.join(dir, "node_modules");
    const stamp = path.join(nodeModules, INSTALL_STAMP);
    if (fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8") === hash) return;

    if (!fs.existsSync(nodeModules)) {
      const seed = this.findSeed(dir, hash);
      if (seed) {
        console.log(`Linking ${path.basename(dir)} dependencies from ${seed.dir}...`);
        this.linkTree(path.join(seed.dir, "node_modules"), nodeModules, seed.root, path.dirname(dir));
        if (seed.matches) {
          fs.writeFileSync(stamp, hash);
          return;
        }
      }
    }

    console.log(`Installing ${path.basename(dir)} dependencies...`);
    execSync("npm install --no-audit --no-fund --prefer-offline", { cwd: dir, stdio: "inherit" });
    fs.writeFileSync(stamp, hash);
    // A different npm version can rewrite the lockfile while installing, and a changed lockfile stops the
    // next try from checking out a newer push here.
    TryBranch.git(["checkout", "--quiet", "--", "package-lock.json"], dir);
  }

  public static lockfileHash(dir: string): string {
    const lockfile = path.join(dir, "package-lock.json");
    return crypto.createHash("sha1").update(fs.readFileSync(lockfile)).digest("hex");
  }

  // The same project folder in your own checkout or another worktree that already has node_modules, preferring one
  // installed from the same lockfile. Your checkout's node_modules carries no stamp, so its lockfile stands in.
  public static findSeed(dir: string, hash: string): { dir: string; root: string; matches: boolean } | undefined {
    const project = path.basename(dir);
    const roots = [
      ROOT,
      ...(fs.existsSync(WORKTREES) ? fs.readdirSync(WORKTREES).map((name) => path.join(WORKTREES, name)) : [])
    ];
    const seeds = roots
      .map((root) => ({ root, dir: path.join(root, project) }))
      .filter((seed) => this.normalizePath(seed.dir) !== this.normalizePath(dir))
      .filter((seed) => fs.existsSync(path.join(seed.dir, "node_modules")))
      .map((seed) => {
        const stamp = path.join(seed.dir, "node_modules", INSTALL_STAMP);
        const seedHash = fs.existsSync(stamp) ? fs.readFileSync(stamp, "utf8") : this.lockfileHash(seed.dir);
        return { ...seed, matches: seedHash === hash };
      });
    return seeds.find((seed) => seed.matches) ?? seeds[0];
  }

  // Recreates the folder tree from under to, hard-linking each file. npm and Vite replace files rather than write
  // into them, so the copies can't change each other. Vite's own cache is left out. A symlink (or a Windows
  // junction, like the file:.. dependency) pointing inside fromRoot is rebuilt to point at the same place in toRoot.
  public static linkTree(from: string, to: string, fromRoot: string, toRoot: string): void {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
      if (entry.name === ".vite" || entry.name === INSTALL_STAMP) continue;
      const source = path.join(from, entry.name);
      const target = path.join(to, entry.name);
      if (entry.isSymbolicLink()) {
        this.relink(source, target, fromRoot, toRoot);
      } else if (entry.isDirectory()) {
        this.linkTree(source, target, fromRoot, toRoot);
      } else {
        try {
          fs.linkSync(source, target);
        } catch {
          fs.copyFileSync(source, target);
        }
      }
    }
  }

  public static relink(source: string, target: string, fromRoot: string, toRoot: string): void {
    const pointsAt = path.resolve(path.dirname(source), fs.readlinkSync(source));
    const inside = path.relative(fromRoot, pointsAt);
    if (inside.startsWith("..") || path.isAbsolute(inside)) return;

    const destination = path.join(toRoot, inside);
    try {
      if (process.platform === "win32") {
        // Junctions need no admin rights but only work for folders, and take an absolute path.
        fs.symlinkSync(destination, target, "junction");
      } else {
        fs.symlinkSync(path.relative(path.dirname(target), destination), target);
      }
    } catch {
      // A link to a file on Windows needs Developer Mode. Leaving it out is safe: npm makes .cmd files for bins there.
    }
  }

  public static async confirm(question: string): Promise<boolean> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(question);
    rl.close();
    return answer.trim().toLowerCase() === "y";
  }

  public static async approve(branch: string, remoteCommit: string, worktree: string): Promise<void> {
    const tried = fs.existsSync(worktree) ? this.git(["rev-parse", "HEAD"], worktree) : undefined;
    if (!tried) {
      console.error(`${branch} hasn't been tried yet. Run "npm run try -- ${branch}" first.`);
      process.exit(1);
    }
    if (tried !== remoteCommit) {
      console.error(`${branch} has new commits since you tried it. Run "npm run try -- ${branch}" again.`);
      process.exit(1);
    }

    const commits = this.git(["log", "--oneline", `origin/master..${tried}`]) || "(none, master already has them)";
    console.log(`\nCommits going onto master:\n${commits}\n`);
    if (!(await this.confirm(`Fast-forward master to ${branch} and delete the branch? [y/N] `))) {
      console.log("Nothing changed.");
      return;
    }

    try {
      execFileSync("git", ["push", "--atomic", "origin", `${tried}:refs/heads/master`, `:refs/heads/${branch}`], {
        cwd: ROOT,
        stdio: "inherit"
      });
    } catch {
      console.error("\nPush rejected, nothing changed. If master has moved on, ask the thread to rebase onto it.");
      process.exit(1);
    }

    this.stop(worktree);
    try {
      this.git(["worktree", "remove", "--force", worktree]);
    } catch {
      console.warn(`Couldn't remove ${worktree} (is it still running?). "npm run try -- --clean" will get it later.`);
    }
    try {
      if (this.git(["branch", "--show-current"]) === "master") {
        this.git(["merge", "--ff-only", "--quiet", "origin/master"]);
      } else {
        this.git(["fetch", "--quiet", "origin", "master:master"]);
      }
    } catch {
      console.warn("Couldn't fast-forward your local master; pull it yourself.");
    }
    console.log(`\nmaster is at ${tried.slice(0, 8)} and ${branch} is deleted.`);
  }

  // Deletes everything in WORKTREES. A folder git no longer tracks as a worktree (left behind when an earlier
  // removal was interrupted, or a file in it was locked) is deleted directly, and one failure doesn't stop the rest.
  public static clean(): void {
    this.git(["worktree", "prune"]);
    if (!fs.existsSync(WORKTREES)) return;
    this.stop(WORKTREES);

    const registered = this.registeredWorktrees();
    let failed = 0;
    for (const name of fs.readdirSync(WORKTREES)) {
      const dir = path.join(WORKTREES, name);
      console.log(`Removing ${name}`);
      try {
        if (registered.has(this.normalizePath(dir))) {
          this.git(["worktree", "remove", "--force", dir]);
        }
        fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
      } catch (error) {
        failed++;
        console.warn(`  Couldn't remove ${dir} (is it still running?): ${(error as Error).message.split("\n")[0]}`);
      }
    }
    this.git(["worktree", "prune"]);
    if (failed > 0) {
      console.warn(`\n${failed} folder(s) left behind. Stop anything running from them and run --clean again.`);
      process.exitCode = 1;
    }
  }

  // Stops whatever is running from inside dir: one branch's worktree, or WORKTREES for all of them.
  public static stop(dir: string): void {
    const stopped = WorktreeProcesses.stop(dir);
    if (stopped > 0) console.log(`Stopped ${stopped} process(es) running from ${path.relative(ROOT, dir)}`);
  }

  public static registeredWorktrees(): Set<string> {
    const lines = this.git(["worktree", "list", "--porcelain"]).split("\n");
    return new Set(
      lines.filter((line) => line.startsWith("worktree ")).map((line) => this.normalizePath(line.slice(9)))
    );
  }

  // Git prints Windows paths with forward slashes, and Windows paths are case-insensitive.
  public static normalizePath(p: string): string {
    const resolved = path.resolve(p);
    return process.platform === "win32" ? resolved.toLowerCase() : resolved;
  }

  public static async freePorts(): Promise<{ server: number; client: number }> {
    for (let offset = 0; offset < 100; offset++) {
      const ports = { server: 2100 + offset, client: 1240 + offset };
      if ((await DevPorts.isFree(ports.server)) && (await DevPorts.isFree(ports.client))) return ports;
    }
    throw new Error("No free port pair found between 2100/1240 and 2199/1339");
  }

  // Pulls --scenario=<Name> or --scenario <Name> out of argv. The name ends up in a shell command, so it's held
  // to the characters a scenario's registered name uses.
  public static takeScenario(argv: string[]): string | undefined {
    const index = argv.findIndex((arg) => arg === "--scenario" || arg.startsWith("--scenario="));
    if (index === -1) return undefined;

    const [, inlineValue] = argv[index].split("=", 2);
    const name = inlineValue ?? argv[index + 1];
    argv.splice(index, inlineValue === undefined ? 2 : 1);
    if (!name || !/^\w+$/.test(name)) {
      console.error(`--scenario needs a scenario name like CombatSandbox, got "${name ?? ""}"`);
      process.exit(1);
    }
    return name;
  }
}

(async () => {
  const argv = process.argv.slice(2);
  const scenario = TryBranch.takeScenario(argv);
  const flags: string[] = argv.filter((arg) => ["--list", "--stop", "--clean", "--approve"].includes(arg));
  const positional = argv.filter((arg) => !arg.startsWith("--"));
  const serverArgs = argv.filter((arg) => arg.startsWith("--") && !flags.includes(arg));

  if (flags.includes("--stop")) {
    TryBranch.stop(WORKTREES);
    return;
  }

  if (flags.includes("--clean")) {
    TryBranch.clean();
    return;
  }

  console.log("Fetching from origin...");
  TryBranch.git(["fetch", "origin", "--prune", "--quiet"]);

  if (flags.includes("--list")) {
    for (const line of TryBranch.recentBranches()) {
      const [ref, age] = line.split("|");
      console.log(`${ref.replace(/^origin\//, "").padEnd(50)} ${age}`);
    }
    return;
  }

  let branch = positional[0]?.replace(/^origin\//, "");
  if (!branch) {
    const newest = TryBranch.recentBranches()[0];
    if (!newest) {
      console.error("No claude/* branches on origin. Pass a branch name.");
      process.exit(1);
    }
    branch = newest.split("|")[0].replace(/^origin\//, "");
  }

  let commit: string;
  try {
    commit = TryBranch.git(["rev-parse", "--verify", "--quiet", `origin/${branch}`]);
  } catch {
    console.error(`No branch origin/${branch}. Run "npm run try -- --list" to see recent ones.`);
    process.exit(1);
  }

  const worktree = path.join(WORKTREES, branch.replace(/[\\/]/g, "-"));
  if (flags.includes("--approve")) {
    await TryBranch.approve(branch, commit, worktree);
    return;
  }

  if (fs.existsSync(worktree)) {
    TryBranch.stop(worktree);
    // Lockfiles an earlier install rewrote (see installIfChanged) would block the checkout.
    TryBranch.git(["checkout", "--quiet", "--", ...LOCKFILES], worktree);
    TryBranch.git(["checkout", "--quiet", "--detach", commit], worktree);
  } else {
    fs.mkdirSync(WORKTREES, { recursive: true });
    TryBranch.git(["worktree", "add", "--quiet", "--detach", worktree, commit]);
  }
  console.log(`\n${branch} @ ${TryBranch.git(["log", "-1", "--format=%h %s"], worktree)}`);
  console.log(`Worktree: ${worktree}\n`);

  TryBranch.installIfChanged(path.join(worktree, "server"));
  TryBranch.installIfChanged(path.join(worktree, "client"));

  const ports = await TryBranch.freePorts();
  const env = { ...DevPorts.env(ports), ...DevPorts.gameOptionsEnv(serverArgs) };
  console.log(`\nServer: ws://localhost:${ports.server}`);
  const openPath = scenario ? `/?test=true&scenario=${scenario}` : "/";
  console.log(`Client: http://localhost:${ports.client}${openPath}\n`);

  const { result } = concurrently(
    [
      {
        command: "npm start",
        name: `server:${ports.server}`,
        cwd: path.join(worktree, "server"),
        env
      },
      { command: `npm run dev -- --open "${openPath}"`, name: `client:${ports.client}`, cwd: path.join(worktree, "client"), env }
    ],
    { killOthers: ["failure"] }
  );

  // concurrently's own cleanup kills each command's process tree by parent PID, which misses processes whose parent
  // already exited (see WorktreeProcesses), so sweep the worktree too. This runs on Ctrl+C, on closing the terminal
  // (SIGHUP) and when either command fails.
  process.on("exit", () => TryBranch.stop(worktree));
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    process.on(signal, () => process.exit(0));
  }

  result.catch(() => process.exit(1));
})();
