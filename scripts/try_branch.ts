import concurrently from "concurrently";
import { execFileSync, execSync } from "child_process";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline/promises";
import { DevPorts } from "./DevPorts";

// Fetches a branch into its own git worktree, installs what changed, and starts it on free ports,
// leaving your own checkout untouched:
//
//   npm run try                          # the most recently pushed claude/* branch
//   npm run try -- claude/some-thread    # a specific branch (the "origin/" prefix is optional)
//   npm run try -- --list                # recent claude/* branches, newest first
//   npm run try -- --clean               # delete every worktree this made
//   npm run approve                      # fast-forward master to the tried branch, then delete it
//
// Approve pushes the exact commit you tried (the branch's worktree), and refuses if the branch has
// moved since or master can't fast-forward to it. To deny, don't approve - reply in the thread.
//
// Worktrees live in ../OpenCiv-branches/ and are reused, so a second try of the same branch just
// moves it to the latest push and skips npm install unless a lockfile changed. Any other arguments
// go to the server as game options, like with start:ports.

const ROOT = path.resolve(__dirname, "..");
const WORKTREES = path.resolve(ROOT, "..", "OpenCiv-branches");
const INSTALL_STAMP = ".try-install-hash";

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

  public static installIfChanged(dir: string): void {
    const lockfile = path.join(dir, "package-lock.json");
    const hash = crypto.createHash("sha1").update(fs.readFileSync(lockfile)).digest("hex");
    const stamp = path.join(dir, "node_modules", INSTALL_STAMP);
    if (fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8") === hash) return;

    console.log(`Installing ${path.basename(dir)} dependencies...`);
    execSync("npm install --no-audit --no-fund", { cwd: dir, stdio: "inherit" });
    fs.writeFileSync(stamp, hash);
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

  public static async freePorts(): Promise<{ server: number; client: number }> {
    for (let offset = 0; offset < 100; offset++) {
      const ports = { server: 2100 + offset, client: 1240 + offset };
      if ((await DevPorts.isFree(ports.server)) && (await DevPorts.isFree(ports.client))) return ports;
    }
    throw new Error("No free port pair found between 2100/1240 and 2199/1339");
  }
}

(async () => {
  const argv = process.argv.slice(2);
  const flags: string[] = argv.filter((arg) => ["--list", "--clean", "--approve"].includes(arg));
  const positional = argv.filter((arg) => !arg.startsWith("--"));
  const serverArgs = argv.filter((arg) => arg.startsWith("--") && !flags.includes(arg));

  if (flags.includes("--clean")) {
    if (fs.existsSync(WORKTREES)) {
      for (const name of fs.readdirSync(WORKTREES)) {
        console.log(`Removing ${name}`);
        TryBranch.git(["worktree", "remove", "--force", path.join(WORKTREES, name)]);
      }
    }
    TryBranch.git(["worktree", "prune"]);
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
  console.log(`Client: http://localhost:${ports.client}\n`);

  const { result } = concurrently(
    [
      {
        command: "npm start",
        name: `server:${ports.server}`,
        cwd: path.join(worktree, "server"),
        env
      },
      { command: "npm run dev -- --open", name: `client:${ports.client}`, cwd: path.join(worktree, "client"), env }
    ],
    { killOthers: ["failure"] }
  );

  result.catch(() => process.exit(1));
})();
