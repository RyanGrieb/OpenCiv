import { ServerArgs } from "../../src/ServerArgs";
import { DefaultGameOptions } from "../../src/GameOptions";

describe("ServerArgs", () => {
  // The parser logs what it applied/ignored, which would otherwise spam the test output.
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const parse = (argv: string[], env: NodeJS.ProcessEnv = {}) => ServerArgs.parseGameOptions(argv, env);

  it("returns no overrides without arguments", () => {
    expect(parse([])).toEqual({});
  });

  it("parses --key=value for booleans and numbers", () => {
    expect(parse(["--allowBarbarians=false", "--numCityStates=7"])).toEqual({
      allowBarbarians: false,
      numCityStates: 7
    });
  });

  it("parses space-separated values", () => {
    expect(parse(["--numCityStates", "5"])).toEqual({ numCityStates: 5 });
  });

  it("treats a bare boolean flag as true, and --no-<option> as false", () => {
    expect(parse(["--allowBarbarians"])).toEqual({ allowBarbarians: true });
    expect(parse(["--no-allowBarbarians"])).toEqual({ allowBarbarians: false });
  });

  it("matches option names ignoring case and dashes", () => {
    expect(parse(["--allow-barbarians=off", "--num_city_states=2"])).toEqual({
      allowBarbarians: false,
      numCityStates: 2
    });
  });

  it("clamps numbers to the option definition range", () => {
    expect(parse(["--numCityStates=999"])).toEqual({ numCityStates: 12 });
    expect(parse(["--numCityStates=-4"])).toEqual({ numCityStates: 0 });
  });

  it("ignores unknown options and unparsable values", () => {
    expect(parse(["--notAnOption=1", "--numCityStates=abc", "--allowBarbarians=maybe"])).toEqual({});
  });

  it("reads the GAME_OPTIONS env var, with argv taking precedence", () => {
    expect(parse([], { GAME_OPTIONS: "allowBarbarians=false, numCityStates=1" })).toEqual({
      allowBarbarians: false,
      numCityStates: 1
    });

    expect(parse(["--numCityStates=8"], { GAME_OPTIONS: "numCityStates=1" })).toEqual({ numCityStates: 8 });
  });

  it("accepts every option on GameOptions, including ones with no client-side definition", () => {
    const argv = Object.entries(DefaultGameOptions).map(([key, value]) => `--${key}=${value}`);
    expect(parse(argv)).toEqual(DefaultGameOptions);
  });

  it("reads the port from --port or SERVER_PORT, with argv taking precedence", () => {
    expect(ServerArgs.parsePort([], {})).toBe(ServerArgs.DEFAULT_PORT);
    expect(ServerArgs.parsePort([], { SERVER_PORT: "2100" })).toBe(2100);
    expect(ServerArgs.parsePort(["--port=2200"], { SERVER_PORT: "2100" })).toBe(2200);
    expect(ServerArgs.parsePort(["--port", "2300"], {})).toBe(2300);
  });

  it("falls back to the default port for an invalid value", () => {
    expect(ServerArgs.parsePort(["--port=abc"], {})).toBe(ServerArgs.DEFAULT_PORT);
    expect(ServerArgs.parsePort(["--port=70000"], {})).toBe(ServerArgs.DEFAULT_PORT);
  });

  it("doesn't treat --port as a game option", () => {
    expect(parse(["--port=2100", "--numCityStates=3"])).toEqual({ numCityStates: 3 });
    expect(parse(["--port", "2100"])).toEqual({});
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("detects --help", () => {
    expect(ServerArgs.helpRequested(["--help"])).toBe(true);
    expect(ServerArgs.helpRequested(["-h"])).toBe(true);
    expect(ServerArgs.helpRequested(["--numCityStates=1"])).toBe(false);
  });

  it("lists every option in its usage text", () => {
    const usage = ServerArgs.usage();
    for (const key of Object.keys(DefaultGameOptions)) {
      expect(usage).toContain(`--${key}=`);
    }
  });
});
