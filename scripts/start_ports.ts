import concurrently from "concurrently";
import * as path from "path";
import { DevPorts } from "./DevPorts";

// Starts a server and client pair on ports of your choosing, with the client wired to its own
// server, so several pairs can run side by side:
//
//   npm run start:ports -- --server-port=2100 --client-port=1240
//
// Any other arguments go to the server as game options (see `npm start --prefix server -- --help`):
//
//   npm run start:ports -- --server-port=2100 --client-port=1240 --no-allowBarbarians
//
// Unlike `npm start`, this doesn't kill whatever holds the ports first - that could be another
// pair - it refuses to start instead.

const ROOT = path.resolve(__dirname, "..");

(async () => {
    let parsed: ReturnType<typeof DevPorts.parse>;
    try {
        parsed = DevPorts.parse(process.argv.slice(2));
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
    const { ports, rest } = parsed;

    const taken = [];
    for (const port of [ports.server, ports.client]) {
        if (!(await DevPorts.isFree(port))) taken.push(port);
    }
    if (taken.length > 0) {
        console.error(`Port ${taken.join(" and ")} already in use. Pick other ports, or stop what's using them.`);
        process.exit(1);
    }

    const env = { ...DevPorts.env(ports), ...DevPorts.gameOptionsEnv(rest) };

    console.log(`Server: ws://localhost:${ports.server}`);
    console.log(`Client: http://localhost:${ports.client}\n`);

    const { result } = concurrently(
        [
            { command: "npm start", name: `server:${ports.server}`, cwd: path.join(ROOT, "server"), env },
            { command: "npm run dev", name: `client:${ports.client}`, cwd: path.join(ROOT, "client"), env }
        ],
        { killOthers: ["failure"] }
    );

    result.catch(() => process.exit(1));
})();
