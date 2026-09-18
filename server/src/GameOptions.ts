export interface GameOptions {
  allowBarbarians: boolean;
  numCityStates: number;
  mapSize: number;
  // 0 disables this - any other value overrides `mapSize` with an exact tile dimension,
  // for test scenarios that need a precise map instead of one of the named presets.
  // Never sent to the client - see GameOptionDefinitions' `hidden` flag below.
  mapSizeOverride: number;
}

// Index-aligned with mapSize's valueLabels below (0 = Duel, ..., 5 = Huge).
const MAP_SIZE_CITY_STATE_COUNTS = [2, 3, 4, 6, 9, 12];

export const DefaultGameOptions: GameOptions = {
  allowBarbarians: true,
  numCityStates: MAP_SIZE_CITY_STATE_COUNTS[3],
  mapSize: 3,
  mapSizeOverride: 0
};

interface BaseGameOptionDefinition {
  key: keyof GameOptions;
  label: string;
  // Excluded from the payload sent to the client (see Game.getGameOptionsPayload) - for
  // options that should only ever be set directly (e.g. by a test scenario script), never
  // surfaced in the Game Options UI.
  hidden?: boolean;
}

interface BooleanGameOptionDefinition extends BaseGameOptionDefinition {
  type: "boolean";
}

interface NumberGameOptionDefinition extends BaseGameOptionDefinition {
  type: "number";
  min: number;
  max: number;
  step: number;
  // Display name for each step (index 0 = min) - lets a slider read as "Medium" instead
  // of the raw underlying number it sends over the network.
  valueLabels?: string[];
  // Runs after this option's value is applied (and before the change is broadcast), so
  // one option can cascade into another - e.g. picking a bigger map size bumps the
  // recommended city-state count, even overwriting whatever the user set it to before.
  onChange?: (options: GameOptions, value: number) => void;
}

export type GameOptionDefinition = BooleanGameOptionDefinition | NumberGameOptionDefinition;

// Describes every option the client is allowed to show and change - the client renders
// its Game Options UI purely from this list (sent over the network alongside the current
// values), so adding a new option only needs an entry here plus a field on GameOptions,
// never a client-side change.
export const GameOptionDefinitions: GameOptionDefinition[] = [
  { key: "allowBarbarians", label: "Allow Barbarians", type: "boolean" },
  { key: "numCityStates", label: "Number of City-States", type: "number", min: 0, max: 12, step: 1 },
  {
    key: "mapSize",
    label: "Map Size",
    type: "number",
    min: 0,
    max: 5,
    step: 1,
    valueLabels: ["Duel", "Tiny", "Small", "Medium", "Large", "Huge"],
    onChange: (options, value) => {
      options.numCityStates = MAP_SIZE_CITY_STATE_COUNTS[value];
    }
  },
  {
    key: "mapSizeOverride",
    label: "Map Size Override (Testing)",
    type: "number",
    min: 0,
    max: 500,
    step: 1,
    hidden: true
  }
];
