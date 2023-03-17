export interface MapResource {
  name: string;
  originTiles: string[];
  followTiles: string[];
  pathLength: number;
  setTileChance: number;
  tempRange: [number, number];
  onAdditionalTileTypes?: boolean;
}

export const BONUS_RESOURCES: MapResource[] = [
  {
    name: "cattle",
    originTiles: ["grass"],
    followTiles: ["grass", "plains"],
    pathLength: 2,
    setTileChance: 0.05,
    tempRange: [32, 90],
  },
  {
    name: "sheep",
    originTiles: [
      "grass",
      "grass_hill",
      "plains",
      "plains_hill",
      "tundra",
      "tundra_hill",
    ],
    pathLength: 2,
    setTileChance: 0.05,
    followTiles: [
      "grass",
      "grass_hill",
      "plains",
      "plains_hill",
      "tundra",
      "tundra_hill",
    ],
    tempRange: [0, 90],
  },
  {
    name: "fish",
    originTiles: ["shallow_ocean", "freshwater"],
    pathLength: 4,
    setTileChance: 0.1,
    followTiles: ["shallow_ocean", "freshwater"],
    tempRange: [0, 100],
  },
  {
    name: "crab",
    originTiles: ["shallow_ocean", "freshwater"],
    pathLength: 2,
    setTileChance: 0.1,
    followTiles: ["shallow_ocean", "freshwater"],
    tempRange: [0, 100],
  },
  {
    name: "whales",
    originTiles: ["shallow_ocean", "ocean"],
    pathLength: 1,
    setTileChance: 0.1,
    followTiles: ["shallow_ocean", "ocean"],
    tempRange: [0, 100],
  },
  {
    name: "turtles",
    originTiles: ["shallow_ocean", "freshwater"],
    pathLength: 1,
    setTileChance: 0.1,
    followTiles: ["shallow_ocean", "freshwater"],
    tempRange: [0, 100], // FIXME: Allow [32,100] but we get stuck in infinite loop.
  },
];

export const STRATEGIC_RESOURCES: MapResource[] = [
  {
    name: "horses",
    originTiles: ["grass", "plains"],
    followTiles: ["grass", "plains"],
    pathLength: 2,
    setTileChance: 0.05,
    tempRange: [32, 90],
  },
];

export const LUXURY_RESOURCES: MapResource[] = [
  {
    name: "copper",
    originTiles: [
      "grass",
      "grass_hill",
      "plains",
      "plains_hill",
      "tundra",
      "tundra_hill",
      "desert",
      "desert_hill",
    ],
    followTiles: [
      "grass",
      "grass_hill",
      "plains",
      "plains_hill",
      "tundra",
      "tundra_hill",
      "desert",
      "desert_hill",
    ],
    pathLength: 2,
    setTileChance: 0.01,
    tempRange: [0, 100],
    onAdditionalTileTypes: true,
  },
];
