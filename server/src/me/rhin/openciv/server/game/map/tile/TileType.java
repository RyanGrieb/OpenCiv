package me.rhin.openciv.server.game.map.tile;

import com.badlogic.gdx.graphics.g2d.Sprite;

public enum TileType {
	GRASS(), GRASS_HILL(2), OCEAN(true), SHALLOW_OCEAN(true), MOUNTAIN(1000000), FOREST(2);

	private boolean isWater;
	private int movementCost;

	TileType() {
		this.movementCost = 1;
	}

	TileType(boolean isWater) {
		this.movementCost = 1;
		this.isWater = isWater;
	}

	TileType(int movementCost) {
		this.movementCost = movementCost;
	}

	public int getID() {
		for (int i = 0; i < values().length; i++) {
			if (values()[i].equals(this))
				return i;
		}

		return -1;
	}

	public int getMovementCost() {
		// TODO: Could we accept a unit parameter and change it based on the type?
		return movementCost;
	}

	public boolean isWater() {
		return isWater;
	}
}