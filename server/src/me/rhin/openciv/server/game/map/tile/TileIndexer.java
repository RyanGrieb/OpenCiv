package me.rhin.openciv.server.game.map.tile;

import java.util.HashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import me.rhin.openciv.server.game.map.GameMap;

public class TileIndexer {

	// All tiles adjacent to ocean

	private HashMap<TileType, ConcurrentLinkedQueue<Tile>> tileTypeList;
	private ConcurrentLinkedQueue<Tile> adjRiverTiles;

	public TileIndexer(GameMap gameMap) {
		this.tileTypeList = new HashMap<>();
		this.adjRiverTiles = new ConcurrentLinkedQueue<>();

		tileTypeList.put(TileType.OCEAN, new ConcurrentLinkedQueue<Tile>());
		for (int x = 0; x < GameMap.WIDTH; x++) {
			for (int y = 0; y < GameMap.HEIGHT; y++) {
				tileTypeList.get(TileType.OCEAN).add(gameMap.getTiles()[x][y]);
			}
		}
	}

	public ConcurrentLinkedQueue<Tile> getAdjacentTilesTo(TileType tileType) {
		return tileTypeList.get(tileType);
	}

	public void setAdjacentTileType(Tile adjTile, TileType tileType) {
		// The tileType is from the original tile, and the adjTile is the adjacent tile.
		if (tileTypeList.get(tileType) == null)
			tileTypeList.put(tileType, new ConcurrentLinkedQueue<Tile>());
		tileTypeList.get(tileType).add(adjTile);
	}

	public void removeAdjacentTileType(Tile adjTile, TileType tileType) {
		if (tileTypeList.get(tileType) == null)
			return;

		tileTypeList.get(tileType).remove(adjTile);
	}

	public ConcurrentLinkedQueue<Tile> getAdjacentRiverTiles() {
		return adjRiverTiles;
	}

	public void setAdjacentRiverTile(Tile tile) {
		adjRiverTiles.add(tile);
	}
}
