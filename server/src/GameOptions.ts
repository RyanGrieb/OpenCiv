export interface GameOptions {
  allowBarbarians: boolean;
  numCityStates: number;
  // Makes the east and west map edges adjacent, so the world is a cylinder rather than a rectangle.
  wrapMap: boolean;
  mapSize: number;
  // Exact map dimensions in tiles, snapped to a multiple of MAP_CHUNK_SIZE by GameMap (the width of
  // a wrapping map to a multiple of GLOBE_WIDTH_STEP). Choosing a
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
  // An Archer beside every player's Settler, for trying out ranged combat (see the RangedCombat scenario).
  startWithArcher: boolean;
  // A Horseman beside every player's Settler, for a melee unit that moves further (see MeleeCombat).
  startWithHorseman: boolean;
  // The health every city is founded with, out of its 200. Lower it to try capturing a city without
  // first spending turns wearing it down (see the CityCombat scenario).
  cityStartingHealth: number;
  // Name of a hand-drawn patch of map in config/map_presets.yml, stamped around the first player's
  // spawn so a scenario gets the same terrain every run (see MapPresets). Empty for a normal map.
  mapPreset: string;
  // Every civilization starts out having met and being at war with every other, as it was before
  // diplomacy existed. For the combat scenarios; real games start at peace (see PlayerDiplomacy).
  startAtWar: boolean;
  // Gold every player starts with, for trying out buying production (see the GoldSpending scenario).
  startingGold: number;
  // Faith every player starts with, for trying out pantheons (see the Pantheons scenario).
  startingFaith: number;
  // Experience every player's starting military units begin with, for trying out promotions (see the
  // Promotions scenario).
  startingExperience: number;
  // Every tech's cost as a percentage of its techs.yml cost, like Civ 5's game speeds (Quick is 67).
  // Scenarios set it to 1 so a tech is researched the turn after it's chosen (see TechEffects).
  techCostPercent: number;
  // Every unit's and building's production cost as a percentage of its config cost, the same way. The
  // Wonders scenario sets it to 1 so a wonder is finished the turn after it's queued.
  productionCostPercent: number;
  // Happiness every player starts with before cities and citizens eat into it. Civ 5 sets it by
  // difficulty (9 on Prince); the Happiness scenario lowers it to reach unhappiness quickly.
  baseHappiness: number;
}

// Maps are streamed to clients in square chunks of this many tiles, so each dimension must divide evenly.
export const MAP_CHUNK_SIZE = 4;

// A wrapping map closes into a globe with six pentagons ringing each pole (the client's
// HexSphere.polarCapsule()), so its width must also be a multiple of 6.
export const GLOBE_WIDTH_STEP = 12;

// Terrain generation places land masses at least 10 tiles in from each edge.
export const MIN_MAP_DIMENSION = 24;

// Index-aligned with mapSize's valueLabels below (0 = Duel, ..., 5 = Huge).
const MAP_SIZE_CITY_STATE_COUNTS = [2, 3, 4, 6, 9, 12];

export class MapSizes {
  // Index-aligned with mapSize's valueLabels below; the index past the last preset means "Custom".
  // Widths are multiples of GLOBE_WIDTH_STEP. Heights are two thirds of the width, which takes
  // the map to about 70 degrees north and south on the globe, where the polar caps' tiles come out
  // the same size as the map's own.
  public static readonly DIMENSIONS: [number, number][] = [
    [48, 32],
    [60, 40],
    [72, 48],
    [84, 56],
    [108, 72],
    [132, 88]
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
  startWithBuilder: false,
  startWithArcher: false,
  startWithHorseman: false,
  cityStartingHealth: 200,
  mapPreset: "",
  startAtWar: false,
  startingGold: 0,
  startingFaith: 0,
  startingExperience: 0,
  techCostPercent: 100,
  productionCostPercent: 100,
  baseHappiness: 9
};

interface BaseGameOptionDefinition {
  key: keyof GameOptions;
  label: string;
  // Only listed in the client's Game Options UI once the player opens its advanced options.
  hidden?: boolean;
  // Heading the client's Game Options UI lists this option under, as a section the player can open and close.
  category?: string;
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
  { key: "wrapMap", label: "Wrap Map East-West", type: "boolean", category: "Map" },
  {
    key: "mapSize",
    label: "Map Size",
    type: "number",
    min: 0,
    max: MapSizes.CUSTOM,
    step: 1,
    valueLabels: ["Duel", "Tiny", "Small", "Medium", "Large", "Huge", "Custom"],
    category: "Map",
    onChange: (options, value) => {
      if (value === MapSizes.CUSTOM) return;

      MapSizes.applyPreset(options, value);
      options.numCityStates = MAP_SIZE_CITY_STATE_COUNTS[value];
    }
  },
  { key: "allowBarbarians", label: "Allow Barbarians", type: "boolean", category: "Opponents" },
  {
    key: "numCityStates",
    label: "Number of City-States",
    type: "number",
    min: 0,
    max: 12,
    step: 1,
    category: "Opponents"
  },
  {
    key: "mapWidth",
    label: "Map Width (Tiles)",
    type: "number",
    min: MIN_MAP_DIMENSION,
    max: 504,
    step: GLOBE_WIDTH_STEP,
    hidden: true,
    category: "Map",
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
    category: "Map",
    onChange: (options) => MapSizes.syncPreset(options)
  },
  { key: "revealMap", label: "Reveal Entire Map", type: "boolean", hidden: true, category: "Map" },
  { key: "spawnPlayersTogether", label: "Spawn Players Together", type: "boolean", hidden: true, category: "Map" },
  {
    key: "startWithAllTechs",
    label: "Start With All Techs",
    type: "boolean",
    hidden: true,
    category: "Starting Bonuses"
  },
  {
    key: "startWithBuilder",
    label: "Start With a Builder",
    type: "boolean",
    hidden: true,
    category: "Starting Bonuses"
  },
  {
    key: "startWithArcher",
    label: "Start With an Archer",
    type: "boolean",
    hidden: true,
    category: "Starting Bonuses"
  },
  {
    key: "startWithHorseman",
    label: "Start With a Horseman",
    type: "boolean",
    hidden: true,
    category: "Starting Bonuses"
  },
  {
    key: "cityStartingHealth",
    label: "City Starting Health",
    type: "number",
    min: 1,
    max: 200,
    step: 1,
    hidden: true,
    category: "Rules"
  },
  {
    key: "startingGold",
    label: "Starting Gold",
    type: "number",
    min: 0,
    max: 10000,
    step: 10,
    hidden: true,
    category: "Starting Bonuses"
  },
  {
    key: "startingFaith",
    label: "Starting Faith",
    type: "number",
    min: 0,
    max: 1000,
    step: 5,
    hidden: true,
    category: "Starting Bonuses"
  },
  {
    key: "startingExperience",
    label: "Starting Experience",
    type: "number",
    min: 0,
    max: 1000,
    step: 5,
    hidden: true,
    category: "Starting Bonuses"
  },
  {
    key: "techCostPercent",
    label: "Tech Cost %",
    type: "number",
    // 0 makes every tech cost 1 science, which scenarios use to research deep into the tree.
    min: 0,
    max: 300,
    step: 1,
    hidden: true,
    category: "Rules"
  },
  {
    key: "productionCostPercent",
    label: "Production Cost %",
    type: "number",
    min: 1,
    max: 300,
    step: 1,
    hidden: true,
    category: "Rules"
  },
  {
    key: "baseHappiness",
    label: "Base Happiness",
    type: "number",
    min: -50,
    max: 50,
    step: 1,
    hidden: true,
    category: "Rules"
  }
];
