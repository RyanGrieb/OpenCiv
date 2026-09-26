export interface GameOptions {
  allowBarbarians: boolean;
  numCityStates: number;
  // Makes the east and west map edges adjacent, so the world is a cylinder rather than a rectangle.
  wrapMap: boolean;
  mapSize: number;
  // Exact map dimensions in tiles, snapped to a multiple of MAP_CHUNK_SIZE by GameMap. Choosing a
  // mapSize preset fills these in; editing them by hand flips mapSize to MapSizes.CUSTOM. Hidden -
  // only shown in the client's advanced options.
  mapWidth: number;
  mapHeight: number;
  // Turns fog of war off: every player sees the whole map and every unit on it. Meant for
  // debugging and for the client scenario tests, which predate fog and assume a full map.
  revealMap: boolean;
  // Starts every player's settler two tiles from the first player's, so their units begin within a
  // step of each other. Meant for the client scenario tests (see MeleeCombat), not real games.
  spawnPlayersTogether: boolean;
  // Every player starts with the whole tech tree researched, and a Builder beside their Settler.
  // Meant for trying out tech-gated features like Builder improvements (see the Builder scenarios).
  startWithAllTechs: boolean;
  startWithBuilder: boolean;
}

// Maps are streamed to clients in square chunks of this many tiles, so each dimension must divide evenly.
export const MAP_CHUNK_SIZE = 4;

// Terrain generation places land masses at least 10 tiles in from each edge.
export const MIN_MAP_DIMENSION = 24;

// Index-aligned with mapSize's valueLabels below (0 = Duel, ..., 5 = Huge).
const MAP_SIZE_CITY_STATE_COUNTS = [2, 3, 4, 6, 9, 12];

export class MapSizes {
  // Index-aligned with mapSize's valueLabels below; the index past the last preset means "Custom".
  public static readonly DIMENSIONS: [number, number][] = [
    [48, 32],
    [56, 36],
    [68, 44],
    [80, 52],
    [104, 64],
    [128, 80]
  ];
  public static readonly CUSTOM = MapSizes.DIMENSIONS.length;

  public static applyPreset(options: GameOptions, preset: number) {
    const dimensions = MapSizes.DIMENSIONS[preset];
    if (!dimensions) return;

    options.mapSize = preset;
    options.mapWidth = dimensions[0];
    options.mapHeight = dimensions[1];
  }

  // Sets mapSize to whichever preset matches the current dimensions, or Custom if none does.
  public static syncPreset(options: GameOptions) {
    const preset = MapSizes.DIMENSIONS.findIndex(([w, h]) => w === options.mapWidth && h === options.mapHeight);
    options.mapSize = preset === -1 ? MapSizes.CUSTOM : preset;
  }
}

export const DefaultGameOptions: GameOptions = {
  allowBarbarians: true,
  numCityStates: MAP_SIZE_CITY_STATE_COUNTS[3],
  wrapMap: true,
  mapSize: 3,
  mapWidth: MapSizes.DIMENSIONS[3][0],
  mapHeight: MapSizes.DIMENSIONS[3][1],
  revealMap: false,
  spawnPlayersTogether: false,
  startWithAllTechs: false,
  startWithBuilder: false
};

interface BaseGameOptionDefinition {
  key: keyof GameOptions;
  label: string;
  // Only listed in the client's Game Options UI once the player opens its advanced options.
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
  { key: "wrapMap", label: "Wrap Map East-West", type: "boolean" },
  {
    key: "mapSize",
    label: "Map Size",
    type: "number",
    min: 0,
    max: MapSizes.CUSTOM,
    step: 1,
    valueLabels: ["Duel", "Tiny", "Small", "Medium", "Large", "Huge", "Custom"],
    onChange: (options, value) => {
      if (value === MapSizes.CUSTOM) return;

      MapSizes.applyPreset(options, value);
      options.numCityStates = MAP_SIZE_CITY_STATE_COUNTS[value];
    }
  },
  {
    key: "mapWidth",
    label: "Map Width (Tiles)",
    type: "number",
    min: MIN_MAP_DIMENSION,
    max: 512,
    step: MAP_CHUNK_SIZE,
    hidden: true,
    onChange: (options) => MapSizes.syncPreset(options)
  },
  {
    key: "mapHeight",
    label: "Map Height (Tiles)",
    type: "number",
    min: MIN_MAP_DIMENSION,
    max: 512,
    step: MAP_CHUNK_SIZE,
    hidden: true,
    onChange: (options) => MapSizes.syncPreset(options)
  },
  { key: "revealMap", label: "Reveal Entire Map", type: "boolean", hidden: true },
  { key: "spawnPlayersTogether", label: "Spawn Players Together", type: "boolean", hidden: true },
  { key: "startWithAllTechs", label: "Start With All Techs", type: "boolean", hidden: true },
  { key: "startWithBuilder", label: "Start With a Builder", type: "boolean", hidden: true }
];
