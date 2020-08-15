package me.rhin.openciv.shared.packet;

public class ChunkTile {

	private int[] tileLayers;
	private int[] riverSides;

	public void setTile(int[] riverSides, int[] tileLayers) {
		this.riverSides = riverSides;
		this.tileLayers = tileLayers;
	}
	
	public int[] getRiverSides() {
		return riverSides;
	}
	
	public int[] getTileLayers() {
		return tileLayers;
	}
}
