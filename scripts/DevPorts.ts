import * as net from "net";

export interface Ports {
    server: number;
    client: number;
}

/**
 * Port handling shared by the root dev launchers, so a server/client pair can run on ports of your
 * choosing (e.g. one pair per branch you're testing) without clashing with another pair.
 */
export class DevPorts {
    public static readonly DEFAULT_SERVER_PORT = 2000;
    public static readonly DEFAULT_CLIENT_PORT = 1234;

    /**
     * Pulls --server-port / --client-port out of argv (either "--flag=N" or "--flag N"), returning
     * the ports and whatever arguments are left over.
     */
    public static parse(argv: string[]): { ports: Ports; rest: string[] } {
        const ports: Ports = { server: this.DEFAULT_SERVER_PORT, client: this.DEFAULT_CLIENT_PORT };
        const rest: string[] = [];

        for (let i = 0; i < argv.length; i++) {
            const [flag, inlineValue] = argv[i].split("=", 2);
            const key = flag === "--server-port" ? "server" : flag === "--client-port" ? "client" : undefined;

            if (key === undefined) {
                rest.push(argv[i]);
                continue;
            }

            const value = inlineValue ?? argv[++i];
            const port = Number(value);
            if (!Number.isInteger(port) || port < 1 || port > 65535) {
                throw new Error(`${flag} needs a port number between 1 and 65535, got "${value}"`);
            }
            ports[key] = port;
        }

        if (ports.server === ports.client) {
            throw new Error(`The server and client can't share port ${ports.server}`);
        }

        return { ports, rest };
    }

    /**
     * Env vars that point the server (SERVER_PORT) and the client's dev server (CLIENT_PORT, plus
     * SERVER_PORT for the websocket it opens) at the given ports.
     */
    public static env(ports: Ports): Record<string, string> {
        return { SERVER_PORT: String(ports.server), CLIENT_PORT: String(ports.client) };
    }

    /**
     * Resolves true if nothing is listening on the port. Binds the same way the server and Vite do
     * (all interfaces), so a port another pair is already using reports as taken.
     */
    public static isFree(port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const probe = net.createServer();
            probe.once("error", () => resolve(false));
            probe.once("listening", () => probe.close(() => resolve(true)));
            probe.listen(port);
        });
    }
}
