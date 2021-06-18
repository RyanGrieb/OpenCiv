package me.rhin.openciv.server.game.map.tile;

public class TileImprovement {

	private TileType tileType;
	private int maxTurns;
	private int workedTurns;
	private boolean finished;

	public TileImprovement(TileType tileType, int maxTurns) {
		this.tileType = tileType;
		this.maxTurns = maxTurns;
	}

	public void addTurnsWorked() {
		workedTurns++;
	}

	public int getTurnsWorked() {
		return workedTurns;
	}

	public int getMaxTurns() {
		return maxTurns;
	}

	public TileType getTileType() {
		return tileType;
	}

	public void setFinished(boolean finished) {
		this.finished = finished;
	}

	public boolean isFinished() {
		return finished;
	}

	public String getName() {
		return tileType.name().toLowerCase();
	}
}
