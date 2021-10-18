package me.rhin.openciv.server.game.options;

public class GameOptions {

	private int mapSize;
	private int turnLengthOffset;

	public GameOptions() {
		this.mapSize = 3;
		this.turnLengthOffset = -1;
	}

	public void setMapSize(int mapSize) {
		this.mapSize = mapSize;
	}

	public int getMapSize() {
		return mapSize;
	}

	public void setTurnLengthOffset(int turnLengthOffset) {
		this.turnLengthOffset = turnLengthOffset;
	}

	public int getTurnLengthOffset() {
		return turnLengthOffset;
	}
}
