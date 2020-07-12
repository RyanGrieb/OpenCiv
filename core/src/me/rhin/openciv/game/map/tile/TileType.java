package me.rhin.openciv.game.map.tile;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;

public enum TileType {
	AIR(TextureEnum.TILE_AIR),
	GRASS(TextureEnum.TILE_GRASS), 
	GRASS_HILL(TextureEnum.TILE_GRASS_HILL, 2), 
	PLAINS(TextureEnum.TILE_PLAINS),
	PLAINS_HILL(TextureEnum.TILE_PLAINS_HILL, 2),
	OCEAN(TextureEnum.TILE_OCEAN, TileProperty.WATER),
	SHALLOW_OCEAN(TextureEnum.TILE_SHALLOW_OCEAN, TileProperty.WATER), 
	MOUNTAIN(TextureEnum.TILE_MOUNTIAN, 1000000, TileProperty.TOP_LAYER),
	FOREST(TextureEnum.TILE_FOREST, 2, TileProperty.TOP_LAYER), 
	JUNGLE(TextureEnum.TILE_JUNGLE, 2, TileProperty.TOP_LAYER),
	HORSES(TextureEnum.TILE_HORSES, TileProperty.RESOURCE),
	IRON(TextureEnum.TILE_IRON, TileProperty.RESOURCE),
	COPPER(TextureEnum.TILE_COPPER, TileProperty.RESOURCE),
	COTTON(TextureEnum.TILE_COTTON, TileProperty.RESOURCE),
	GEMS(TextureEnum.TILE_GEMS, TileProperty.RESOURCE),
	CITY(TextureEnum.TILE_CITY, TileProperty.TOP_LAYER);
	
	public enum TileProperty {
		WATER, RESOURCE, TOP_LAYER;
	}
	
	private TextureEnum assetEnum;
	private TileProperty[] tileProperties;
	private int movementCost;

	TileType(TextureEnum assetEnum) {
		this.assetEnum = assetEnum;
		this.movementCost = 1;
	}

	TileType(TextureEnum assetEnum, TileProperty... tileProperties) {
		this.assetEnum = assetEnum;
		this.movementCost = 1;
		this.tileProperties = tileProperties;
	}

	TileType(TextureEnum assetEnum, int movementCost, TileProperty... tileProperties) {
		this.assetEnum = assetEnum;
		this.movementCost = movementCost;
		this.tileProperties = tileProperties;
	}

	public static TileType fromId(int i) {
		return values()[i];
	}

	public Sprite sprite() {
		return assetEnum.sprite();
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
