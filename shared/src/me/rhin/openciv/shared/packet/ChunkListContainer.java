package me.rhin.openciv.shared.packet;

import java.util.ArrayList;

public class ChunkListContainer {

	private ArrayList<ChunkTile> tiles;

	public void setTiles(ArrayList<ChunkTile> tiles) {
		this.tiles = tiles;
	}

	public ArrayList<ChunkTile> getTiles() {
		return tiles;
	}
}
