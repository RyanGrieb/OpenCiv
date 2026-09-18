// Kills leftover dev processes before a fresh `npm start`.
//
// Freeing the ports is not enough. Killing the npm/npx wrapper leaves the real `parcel`
// child alive, and that orphan keeps watching and rewriting client/dist. A newly started
// dev server then sees those writes, rebuilds, writes dist again, and the two ping-pong
// into an endless rebuild loop that pegs the CPU and bloats .parcel-cache.

const { execSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";

// Only the two dev servers, never anything else this repo happens to be running
// (editors and language servers also report a command line under the repo root).
function isDevProcess(cmdline) {
  if (!cmdline) return false;
  const normalized = cmdline.split("\\").join("/").toLowerCase();
  const root = ROOT.split("\\").join("/").toLowerCase();

  // The npx wrapper's command line has no repo path, so match parcel on our entry point.
  const isParcel = normalized.includes("parcel") && normalized.includes("index.html");
  const isServer =
    normalized.includes(root) &&
    (normalized.includes("ts-node-dev") || normalized.includes("src/server.ts"));

  return isParcel || isServer;
}

function listProcesses() {
  if (isWin) {
    const ps =
      "Get-CimInstance Win32_Process -Filter \\\"Name='node.exe'\\\" | " +
      "Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress";
    const out = execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`, {
      encoding: "utf8",
      windowsHide: true,
    });
    if (!out.trim()) return [];
    const parsed = JSON.parse(out);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows.map((row) => ({ pid: row.ProcessId, cmdline: row.CommandLine }));
  }

  const out = execSync("ps -eo pid=,args=", { encoding: "utf8" });
  return out
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const space = line.indexOf(" ");
      return { pid: Number(line.slice(0, space)), cmdline: line.slice(space + 1) };
    });
}

function kill(pid) {
  try {
    process.kill(pid, "SIGKILL");
    return true;
  } catch {
    return false;
  }
}

let killed = 0;
try {
  for (const proc of listProcesses()) {
    if (proc.pid === process.pid || proc.pid === process.ppid) continue;
    if (!isDevProcess(proc.cmdline)) continue;
    if (kill(proc.pid)) killed++;
  }
} catch (e) {
  console.log("Process cleanup warning:", e.message);
}

console.log(killed > 0 ? `Cleaned up ${killed} leftover dev process(es).` : "No leftover dev processes.");
