package me.rhin.openciv.game.map.tile;

public class TileNode implements Comparable<TileNode> {

	private Tile tile;
	private int fScore;

	public TileNode(Tile tile, int fScore) {
		this.tile = tile;
		this.fScore = fScore;
	}

	public Tile getTile() {
		return tile;
	}

	public int getFScore() {
		return fScore;
	}

	@Override
	public int compareTo(TileNode tileNode) {
		if (this.getFScore() < tileNode.getFScore())
			return 1;
		else if (this.getFScore() > tileNode.getFScore())
			return -1;
		else
			return 0;
	}

}
