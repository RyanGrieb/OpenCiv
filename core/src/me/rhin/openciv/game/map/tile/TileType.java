package me.rhin.openciv.game.map.tile;

import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.graphics.g2d.TextureAtlas.AtlasRegion;

import me.rhin.openciv.asset.TextureEnum;

public enum TileType {
	CITY(TextureEnum.TILE_CITY, TileLayer.TOP),
	GRASS(TextureEnum.TILE_GRASS, TileLayer.BASE, TileProperty.FARMABLE),
	GRASS_HILL(TextureEnum.TILE_GRASS_HILL, 2, TileLayer.BASE, TileProperty.FARMABLE, TileProperty.MINEABLE),
	PLAINS(TextureEnum.TILE_PLAINS, TileLayer.BASE, TileProperty.FARMABLE),
	PLAINS_HILL(TextureEnum.TILE_PLAINS_HILL, 2, TileLayer.BASE, TileProperty.FARMABLE, TileProperty.MINEABLE),
	DESERT(TextureEnum.TILE_DESERT, TileLayer.BASE),
	FLOODPLAINS(TextureEnum.TILE_FLOODPLAINS, TileLayer.BASE, TileProperty.FARMABLE),
	DESERT_HILL(TextureEnum.TILE_DESERT_HILL, 2, TileLayer.BASE, TileProperty.MINEABLE),
	TUNDRA(TextureEnum.TILE_TUNDRA, TileLayer.BASE),
	TUNDRA_HILL(TextureEnum.TILE_TUNDRA_HILL, 2, TileLayer.BASE, TileProperty.MINEABLE),
	OCEAN(TextureEnum.TILE_OCEAN, TileLayer.BASE, TileProperty.WATER),
	SHALLOW_OCEAN(TextureEnum.TILE_SHALLOW_OCEAN, TileLayer.BASE, TileProperty.WATER),
	MOUNTAIN(TextureEnum.TILE_MOUNTIAN, 1000000, TileLayer.MIDDLE),
	FOREST(TextureEnum.TILE_FOREST, 2, TileLayer.HIGH),
	JUNGLE(TextureEnum.TILE_JUNGLE, 2, TileLayer.HIGH),
	HORSES(TextureEnum.TILE_HORSES, TileLayer.MIDDLE, TileProperty.RESOURCE),
	IRON(TextureEnum.TILE_IRON, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.MINEABLE),
	COPPER(TextureEnum.TILE_COPPER, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.MINEABLE),
	COTTON(TextureEnum.TILE_COTTON, TileLayer.MIDDLE, TileProperty.RESOURCE),
	GEMS(TextureEnum.TILE_GEMS, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.MINEABLE),
	FARM(TextureEnum.TILE_FARM, TileLayer.HIGH, TileProperty.IMPROVEMENT),
	GEMS_IMPROVED(TextureEnum.TILE_GEMS_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	COTTON_IMPROVED(TextureEnum.TILE_COTTON_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	IRON_IMPROVED(TextureEnum.TILE_IRON_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	COPPER_IMPROVED(TextureEnum.TILE_COPPER_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	GRASS_HILL_MINE(TextureEnum.TILE_GRASS_HILL_MINE, TileLayer.BASE, TileProperty.RESOURCE),
	PLAINS_HILL_MINE(TextureEnum.TILE_PLAINS_HILL_MINE, TileLayer.BASE, TileProperty.RESOURCE),
	DESERT_HILL_MINE(TextureEnum.TILE_DESERT_HILL_MINE, TileLayer.BASE, TileProperty.RESOURCE),
	TUNDRA_HILL_MINE(TextureEnum.TILE_TUNDRA_HILL_MINE, TileLayer.BASE, TileProperty.RESOURCE),
	;

	public enum TileLayer {
		BASE,
		MIDDLE,
		HIGH,
		TOP;
	}

	public enum TileProperty {
		WATER,
		RESOURCE,
		IMPROVEMENT,
		MINEABLE,
		FARMABLE;
	}

	private TextureEnum assetEnum;
	private TileProperty[] tileProperties;
	private TileLayer tileLayer;
	private int movementCost;

	TileType(TextureEnum assetEnum, TileLayer tileLayer) {
		this.assetEnum = assetEnum;
		this.tileLayer = tileLayer;
		this.movementCost = 1;
	}

	TileType(TextureEnum assetEnum, TileLayer tileLayer, TileProperty... tileProperties) {
		this.assetEnum = assetEnum;
		this.tileLayer = tileLayer;
		this.movementCost = 1;
		this.tileProperties = tileProperties;
	}

	TileType(TextureEnum assetEnum, int movementCost, TileLayer tileLayer, TileProperty... tileProperties) {
		this.assetEnum = assetEnum;
		this.movementCost = movementCost;
		this.tileLayer = tileLayer;
		this.tileProperties = tileProperties;
	}

	public static TileType fromId(int i) {
		if (i < 0)
			return null;
		return values()[i];
	}

	public Sprite sprite() {
		return assetEnum.sprite();
	}

	public AtlasRegion texture() {
		return assetEnum.texture();
	}

	public int getMovementCost() {
		return movementCost;
	}

	public boolean hasProperty(TileProperty... targetProperties) {
		if (tileProperties == null)
			return false;

		for (TileProperty tileProperty : tileProperties) {
			for (TileProperty targetProperty : targetProperties)
				if (tileProperty == targetProperty)
					return true;
		}

		return false;
	}

	public TileProperty[] getProperties() {
		return tileProperties;
	}

	public TileLayer getTileLayer() {
		return tileLayer;
	}

	public String getName() {
		String name = name().toLowerCase();
		name = name.replaceAll("_", " ");
		char[] chars = name.toCharArray();
		for (int i = 0; i < chars.length; i++) {
			if (i == 0) {
				chars[i] = Character.toUpperCase(chars[i]);
			}

			if (chars[i] == ' ' && i + 1 < chars.length)
				chars[i + 1] = Character.toUpperCase(chars[i + 1]);
		}

		return String.valueOf(chars);
	}
}
