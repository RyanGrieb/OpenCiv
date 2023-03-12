

export interface MapResource {
    name: string;
    originTiles: string[];
    followTiles: string[]
    pathLength: number,
    setTileChance: number,
    tempRange: [number, number];
}

export const BONUS_RESOURCES: MapResource[] = [
    { name: "cattle", originTiles: ["grass"], followTiles: ["grass", "plains"], pathLength: 2, setTileChance: 0.05, tempRange: [32, 90] },
    { name: "sheep", originTiles: ["grass", "grass_hill", "plains", "plains_hill", "tundra", "tundra_hill"], pathLength: 2, setTileChance: 0.05, followTiles: ["grass", "grass_hill", "plains", "plains_hill", "tundra", "tundra_hill"], tempRange: [0, 90] },
    { name: "fish", originTiles: ["ocean"], pathLength: 4, setTileChance: 0.1, followTiles: ["ocean"], tempRange: [0, 100] },
]

export const STRATEGIC_RESOURCES: MapResource[] = [
    { name: "horses", originTiles: ["grass", "plains"], followTiles: ["grass", "plains"], pathLength: 2, setTileChance: 0.05, tempRange: [32, 90] }
]

export const LUXURY_RESOURCES: MapResource[] = [
    { name: "copper", originTiles: ["grass", "grass_hill", "plains", "plains_hill", "tundra", "tundra_hill", "desert", "desert_hill"], followTiles: ["grass", "grass_hill", "plains", "plains_hill", "tundra", "tundra_hill", "desert", "desert_hill"], pathLength: 2, setTileChance: 0.01, tempRange: [0, 100] }
]