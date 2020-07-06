package me.rhin.openciv.server.game.map.tile;

public enum TileType {

	AIR(), GRASS(), GRASS_HILL(2), PLAINS(), PLAINS_HILL(2), OCEAN(TileProperty.WATER),
	SHALLOW_OCEAN(TileProperty.WATER), MOUNTAIN(1000000, TileProperty.TOP_LAYER), FOREST(2, TileProperty.TOP_LAYER),
	JUNGLE(2, TileProperty.TOP_LAYER);

	public enum TileProperty {
		WATER, TOP_LAYER;
	}

	private int movementCost;
	private TileProperty[] tileProperties;

	TileType() {
		this.movementCost = 1;
	}

	TileType(TileProperty... tileProperties) {
		this.tileProperties = tileProperties;
	}

	TileType(int movementCost) {
		this.movementCost = movementCost;
	}

	TileType(int movementCost, TileProperty... tileProperties) {
		this.movementCost = movementCost;
		this.tileProperties = tileProperties;
	}

	public int getID() {
		for (int i = 0; i < values().length; i++) {
			if (values()[i].equals(this))
				return i;
		}

		return -1;
	}

	public int getMovementCost() {
		return movementCost;
	}

	public boolean hasProperty(TileProperty targetProperty) {
		if (tileProperties == null)
			return false;

		for (TileProperty tileProperty : tileProperties)
			if (tileProperty == targetProperty)
				return true;

		return false;
	}
}