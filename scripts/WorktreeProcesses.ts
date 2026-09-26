import { execFileSync } from "child_process";
import * as path from "path";

interface ProcessInfo {
  pid: number;
  commandLine: string;
}

// Finds and stops the processes a tried branch left running, by looking for its worktree's path in each process's
// command line rather than by walking parent PIDs. On Windows, Ctrl+C reaches every process in the console at once,
// so the npm and cmd layers between the launcher and node often exit first, and a parent-PID tree kill then misses the
// node processes (Vite, ts-node-dev and the server it forks) orphaned beneath them. Those all run scripts from the
// worktree's own node_modules, so their command lines always name it.
export class WorktreeProcesses {
  // The PIDs of every process, other than this one, running the server or client from inside dir.
  public static find(dir: string): number[] {
    const needle = this.normalize(path.resolve(dir));
    return this.list()
      .filter((proc) => proc.pid !== process.pid && this.runsFrom(this.normalize(proc.commandLine), needle))
      .map((proc) => proc.pid);
  }

  // Stops every process running from inside dir and returns how many there were. Runs synchronously, so it's safe
  // to call from an exit or signal handler.
  public static stop(dir: string): number {
    const pids = this.find(dir);
    if (pids.length === 0) return 0;

    if (process.platform === "win32") {
      for (const pid of pids) {
        try {
          execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
        } catch {
          // Already gone, e.g. taken down with an earlier PID's tree.
        }
      }
      return pids.length;
    }

    this.signal(pids, "SIGTERM");
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline && pids.some((pid) => this.isAlive(pid))) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
    this.signal(
      pids.filter((pid) => this.isAlive(pid)),
      "SIGKILL"
    );
    return pids.length;
  }

  private static list(): ProcessInfo[] {
    if (process.platform === "win32") {
      const json = execFileSync(
        "powershell",
        [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          "Get-CimInstance Win32_Process | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress"
        ],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 }
      );
      const rows: { ProcessId: number; CommandLine: string | null }[] = [].concat(JSON.parse(json || "[]"));
      return rows.map((row) => ({ pid: row.ProcessId, commandLine: row.CommandLine ?? "" }));
    }

    const output = execFileSync("ps", ["-eo", "pid=,args="], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    return output
      .split("\n")
      .map((line) => line.trim().match(/^(\d+)\s+(.*)$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => ({ pid: Number(match[1]), commandLine: match[2] }));
  }

  // Windows command lines mix slash styles and paths there are case-insensitive.
  private static normalize(text: string): string {
    return process.platform === "win32" ? text.replace(/\//g, "\\").toLowerCase() : text;
  }

  // True if text runs something from the server's or client's node_modules inside dir, where dir is one worktree or
  // the folder holding them all. Matching only node_modules, not any mention of dir, spares a shell or editor that
  // merely has the worktree's path in its command line.
  private static runsFrom(text: string, dir: string): boolean {
    const sep = this.escape(path.sep);
    const worktreeName = `(?:${sep}[^${sep}"'\\s]+)?`;
    return new RegExp(`${this.escape(dir)}${worktreeName}${sep}(?:server|client)${sep}node_modules${sep}`).test(text);
  }

  private static escape(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private static signal(pids: number[], signal: NodeJS.Signals): void {
    for (const pid of pids) {
      try {
        process.kill(pid, signal);
      } catch {
        // Already exited.
      }
    }
  }

  private static isAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }
}
