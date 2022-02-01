package me.rhin.openciv.server.game.map.tile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.map.GameMap;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;

public class TileIndexer {

	// All tiles adjacent to ocean

	private HashMap<TileType, ConcurrentLinkedQueue<Tile>> adjTileTypeList;
	private ConcurrentLinkedQueue<Tile> adjRiverTiles;
	private HashMap<TileType, ArrayList<Tile>> tileTypeOf;
	private HashMap<TileProperty, ArrayList<Tile>> tilePropertyOf;

	public TileIndexer(GameMap gameMap) {
		this.adjTileTypeList = new HashMap<>();
		this.adjRiverTiles = new ConcurrentLinkedQueue<>();
		this.tileTypeOf = new HashMap<>();
		this.tilePropertyOf = new HashMap<>();

		adjTileTypeList.put(TileType.OCEAN, new ConcurrentLinkedQueue<Tile>());

		int width = Server.getInstance().getMap().getWidth();
		int height = Server.getInstance().getMap().getHeight();

		for (int x = 0; x < width; x++) {
			for (int y = 0; y < height; y++) {
				adjTileTypeList.get(TileType.OCEAN).add(gameMap.getTiles()[x][y]);
			}
		}
	}

	public ConcurrentLinkedQueue<Tile> getAdjacentTilesTo(TileType tileType) {
		return adjTileTypeList.get(tileType);
	}

	public void setAdjacentTileType(Tile adjTile, TileType tileType) {
		// The tileType is from the original tile, and the adjTile is the adjacent tile.
		if (adjTileTypeList.get(tileType) == null)
			adjTileTypeList.put(tileType, new ConcurrentLinkedQueue<Tile>());
		adjTileTypeList.get(tileType).add(adjTile);
	}

	public void removeAdjacentTileType(Tile adjTile, TileType tileType) {
		if (adjTileTypeList.get(tileType) == null)
			return;

		adjTileTypeList.get(tileType).remove(adjTile);
	}

	public void setTilePropertfyOf(Tile tile, TileProperty[] tileProperties) {
		for (TileProperty tileProperty : tileProperties) {

			if (tilePropertyOf.get(tileProperty) == null)
				tilePropertyOf.put(tileProperty, new ArrayList<Tile>());

			tilePropertyOf.get(tileProperty).add(tile);
		}
	}
	
	public void removeTilePropertyOf(Tile tile, TileProperty[] tileProperties) {

	}

	public ConcurrentLinkedQueue<Tile> getAdjacentRiverTiles() {
		return adjRiverTiles;
	}

	public void setAdjacentRiverTile(Tile tile) {
		adjRiverTiles.add(tile);
	}

	public ArrayList<Tile> getTilesOf(TileProperty tileProperty) {
		return tilePropertyOf.get(tileProperty);
	}
	
	public ArrayList<Tile> getTilesOf(TileType tileType) {
		return tileTypeOf.get(tileType);
	}
}
