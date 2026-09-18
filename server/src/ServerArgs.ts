import { DefaultGameOptions, GameOptionDefinitions, GameOptions } from "./GameOptions";
import { Numbers } from "./util/Numbers";

type GameOptionKey = keyof GameOptions;

/**
 * Parses game option overrides passed to the server process, so a troubleshooting session can be
 * configured up-front (`npm start -- --allowBarbarians=false`) instead of through the client's UI.
 *
 * Every field on GameOptions is accepted automatically - the key list and each value's type come
 * from DefaultGameOptions, so a new option needs no change here. Options that aren't in
 * GameOptionDefinitions (not shown in the client's UI) are still settable this way.
 */
export class ServerArgs {
  // Accepted spellings of a boolean value, e.g. --allowBarbarians=off
  private static readonly TRUE_VALUES = ["true", "1", "yes", "y", "on"];
  private static readonly FALSE_VALUES = ["false", "0", "no", "n", "off"];

  // Comma-separated "key=value" pairs, for environments where passing argv is awkward (docker compose,
  // `npm start` at the repo root, which runs the server through concurrently).
  private static readonly ENV_VAR = "GAME_OPTIONS";

  public static helpRequested(argv: string[] = process.argv.slice(2)): boolean {
    return argv.some((arg) => arg === "--help" || arg === "-h");
  }

  /**
   * Reads option overrides from the GAME_OPTIONS env var first, then argv (argv wins on conflict).
   * Unknown keys and unparsable values are warned about and skipped - the server still starts.
   */
  public static parseGameOptions(
    argv: string[] = process.argv.slice(2),
    env: NodeJS.ProcessEnv = process.env
  ): Partial<GameOptions> {
    const overrides: Partial<GameOptions> = {};

    for (const [key, value] of this.envPairs(env).concat(this.argvPairs(argv))) {
      this.applyOverride(overrides, key, value);
    }

    const applied = Object.keys(overrides);
    if (applied.length > 0) {
      console.log(
        "Game option overrides: " + applied.map((key) => `${key}=${overrides[key as GameOptionKey]}`).join(", ")
      );
    }

    return overrides;
  }

  public static usage(): string {
    const lines = ["Usage: npm start -- [options]", "", "Game options:"];

    for (const key of this.optionKeys()) {
      const definition = GameOptionDefinitions.find((def) => def.key === key);
      const range = definition?.type === "number" ? ` (${definition.min}-${definition.max})` : "";
      const type = typeof DefaultGameOptions[key];

      lines.push(`  --${key}=<${type}>${range}`.padEnd(38) + `default: ${DefaultGameOptions[key]}`);
    }

    lines.push(
      "",
      "Booleans also accept --<option> / --no-<option>, and option names are matched ignoring case",
      "and dashes (--allow-barbarians works too).",
      "",
      `Options can also be set via the ${this.ENV_VAR} env var, e.g. ${this.ENV_VAR}="allowBarbarians=false,numCityStates=0".`,
      "",
      "Examples:",
      "  npm start -- --no-allowBarbarians --numCityStates=0",
      "  npm start -- --allow-barbarians=false"
    );

    return lines.join("\n");
  }

  private static optionKeys(): GameOptionKey[] {
    return Object.keys(DefaultGameOptions) as GameOptionKey[];
  }

  private static argvPairs(argv: string[]): [string, string | undefined][] {
    const pairs: [string, string | undefined][] = [];

    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];

      if (!arg.startsWith("--") || arg === "--help") continue;

      const equalsIndex = arg.indexOf("=");
      if (equalsIndex !== -1) {
        pairs.push([arg.substring(2, equalsIndex), arg.substring(equalsIndex + 1)]);
        continue;
      }

      // A bare flag takes the next argument as its value, unless that's another flag (--numCityStates 0),
      // in which case it's a boolean shorthand (--allowBarbarians).
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        pairs.push([arg.substring(2), next]);
        i++;
      } else {
        pairs.push([arg.substring(2), undefined]);
      }
    }

    return pairs;
  }

  private static envPairs(env: NodeJS.ProcessEnv): [string, string | undefined][] {
    const raw = env[this.ENV_VAR];
    if (!raw) return [];

    return raw
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .map((entry) => {
        const equalsIndex = entry.indexOf("=");
        return equalsIndex === -1
          ? ([entry, undefined] as [string, string | undefined])
          : ([entry.substring(0, equalsIndex), entry.substring(equalsIndex + 1)] as [string, string | undefined]);
      });
  }

  private static applyOverride(overrides: Partial<GameOptions>, rawKey: string, rawValue: string | undefined) {
    const negated = this.normalize(rawKey).startsWith("no") && this.matchKey(rawKey) === undefined;
    const key = negated ? this.matchKey(rawKey.replace(/^no[-_]?/i, "")) : this.matchKey(rawKey);

    if (key === undefined) {
      console.warn(`Ignoring unknown option "--${rawKey}". Known options: ${this.optionKeys().join(", ")}`);
      return;
    }

    if (typeof DefaultGameOptions[key] === "boolean") {
      const value = this.parseBoolean(rawValue);

      if (value === undefined) {
        console.warn(`Ignoring "--${rawKey}": "${rawValue}" is not a boolean`);
        return;
      }

      this.setOverride(overrides, key, (negated ? !value : value) as GameOptions[typeof key]);
      return;
    }

    const value = Number(rawValue);

    if (rawValue === undefined || rawValue.trim() === "" || isNaN(value)) {
      console.warn(`Ignoring "--${rawKey}": "${rawValue}" is not a number`);
      return;
    }

    const definition = GameOptionDefinitions.find((def) => def.key === key);
    const clamped = definition?.type === "number" ? Numbers.clamp(value, definition.min, definition.max) : value;

    if (clamped !== value) {
      console.warn(`Clamped "--${rawKey}" from ${value} to ${clamped}`);
    }

    this.setOverride(overrides, key, clamped as GameOptions[typeof key]);
  }

  // Generic binds K per-call so the value's type lines up with the field the key picks - see
  // Game.setGameOption for the same workaround.
  private static setOverride<K extends GameOptionKey>(overrides: Partial<GameOptions>, key: K, value: GameOptions[K]) {
    overrides[key] = value;
  }

  private static matchKey(rawKey: string): GameOptionKey | undefined {
    return this.optionKeys().find((key) => this.normalize(key) === this.normalize(rawKey));
  }

  private static parseBoolean(rawValue: string | undefined): boolean | undefined {
    if (rawValue === undefined) return true;

    const value = rawValue.trim().toLowerCase();

    if (this.TRUE_VALUES.includes(value)) return true;
    if (this.FALSE_VALUES.includes(value)) return false;

    return undefined;
  }

  private static normalize(key: string): string {
    return key.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
}
