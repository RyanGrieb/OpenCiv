
package me.rhin.openciv.game.map.tile;

import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.graphics.g2d.TextureAtlas.AtlasRegion;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.SoundEnum;
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
	MOUNTAIN(TextureEnum.TILE_MOUNTIAN, 1000000, TileLayer.HIGH),
	FOREST(TextureEnum.TILE_FOREST, 2, TileLayer.HIGH, SoundEnum.WOOD_CHOP),
	JUNGLE(TextureEnum.TILE_JUNGLE, 2, TileLayer.HIGH, SoundEnum.WOOD_CHOP),
	HORSES(TextureEnum.TILE_HORSES, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.ANIMAL),
	CATTLE(TextureEnum.TILE_CATTLE, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.ANIMAL),
	SHEEP(TextureEnum.TILE_SHEEP, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.ANIMAL),
	IRON(TextureEnum.TILE_IRON, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.MINEABLE),
	COPPER(TextureEnum.TILE_COPPER, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.MINEABLE),
	COTTON(TextureEnum.TILE_COTTON, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.HARVESTABLE),
	ORANGES(TextureEnum.TILE_ORANGES, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.HARVESTABLE),
	GEMS(TextureEnum.TILE_GEMS, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.MINEABLE),
	MARBLE(TextureEnum.TILE_MARBLE, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.QUARRY),
	FISH(TextureEnum.TILE_FISH, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.WATER,
			TileProperty.OCEAN_FARMABLE),
	CRABS(TextureEnum.TILE_CRABS, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.WATER,
			TileProperty.OCEAN_FARMABLE),
	SILVER(TextureEnum.TILE_SILVER, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.MINEABLE),
	GOLD(TextureEnum.TILE_GOLD, TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.MINEABLE),
	FARM(TextureEnum.TILE_FARM, TileLayer.LOW, SoundEnum.FARM_TILL, TileProperty.IMPROVEMENT),
	GEMS_IMPROVED(TextureEnum.TILE_GEMS_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	MARBLE_IMPROVED(TextureEnum.TILE_MARBLE_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	FISH_IMPROVED(TextureEnum.TILE_FISH_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT, TileProperty.WATER),
	CRABS_IMPROVED(TextureEnum.TILE_CRABS_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT, TileProperty.WATER),
	SILVER_IMPROVED(TextureEnum.TILE_SILVER_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	GOLD_IMPROVED(TextureEnum.TILE_GOLD_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	COTTON_IMPROVED(TextureEnum.TILE_COTTON_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	ORANGES_IMPROVED(TextureEnum.TILE_ORANGES_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	IRON_IMPROVED(TextureEnum.TILE_IRON_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	COPPER_IMPROVED(TextureEnum.TILE_COPPER_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	GRASS_HILL_MINE(TextureEnum.TILE_GRASS_HILL_MINE, TileLayer.BASE, TileProperty.IMPROVEMENT),
	PLAINS_HILL_MINE(TextureEnum.TILE_PLAINS_HILL_MINE, TileLayer.BASE, TileProperty.IMPROVEMENT),
	DESERT_HILL_MINE(TextureEnum.TILE_DESERT_HILL_MINE, TileLayer.BASE, TileProperty.IMPROVEMENT),
	TUNDRA_HILL_MINE(TextureEnum.TILE_TUNDRA_HILL_MINE, TileLayer.BASE, TileProperty.IMPROVEMENT),
	HORSES_IMPROVED(TextureEnum.TILE_HORSES_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	CATTLE_IMPROVED(TextureEnum.TILE_CATTLE_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	SHEEP_IMPROVED(TextureEnum.TILE_SHEEP_IMPROVED, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	LUMBERMILL(TextureEnum.TILE_LUMBERMILL, TileLayer.HIGH, TileProperty.IMPROVEMENT),
	FORT(TextureEnum.TILE_FORT, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	ST_HELENS(TextureEnum.TILE_ST_HELENS, 1000000, TileLayer.HIGH, TileProperty.NATURAL_WONDER),
	BARBARIAN_CAMP(TextureEnum.TILE_BARBARIAN_CAMP, TileLayer.MIDDLE, TileProperty.IMPROVEMENT),
	RUINS(TextureEnum.TILE_RUINS, TileLayer.MIDDLE, SoundEnum.RUIN_CAPTURE, TileProperty.IMPROVEMENT),
	ROAD(0.5F, TileProperty.ROAD);

	public enum TileLayer {
		BASE,
		LOW,
		LOW_MIDDLE,
		MIDDLE,
		HIGH,
		TOP;
	}

	public enum TileProperty {
		WATER,
		RESOURCE,
		IMPROVEMENT,
		MINEABLE,
		ANIMAL,
		FARMABLE,
		HARVESTABLE,
		ROAD,
		QUARRY,
		OCEAN_FARMABLE,
		NATURAL_WONDER;
	}

	private TextureEnum assetEnum;
	private TileProperty[] tileProperties;
	private TileLayer tileLayer;
	private SoundEnum sound;
	private float movementCost;

	// Road Constructor
	TileType(float movementCost, TileProperty... targetProperties) {
		this.assetEnum = null;
		this.movementCost = movementCost;
		this.tileProperties = targetProperties;
		this.tileLayer = TileLayer.LOW_MIDDLE;
	}

	TileType(TextureEnum assetEnum, TileLayer tileLayer) {
		this.assetEnum = assetEnum;
		this.tileLayer = tileLayer;
		this.movementCost = 1;
	}

	TileType(TextureEnum assetEnum, TileLayer tileLayer, TileProperty... tileProperties) {
		this(assetEnum, tileLayer);
		this.tileProperties = tileProperties;
	}

	TileType(TextureEnum assetEnum, int movementCost, TileLayer tileLayer, TileProperty... tileProperties) {
		this(assetEnum, tileLayer, tileProperties);
		this.movementCost = movementCost;
	}

	TileType(TextureEnum assetEnum, TileLayer tileLayer, SoundEnum removeSound, TileProperty... tileProperties) {
		this(assetEnum, 1, tileLayer, tileProperties);
		this.sound = removeSound;
	}

	TileType(TextureEnum assetEnum, int movementCost, TileLayer tileLayer, SoundEnum removeSound,
			TileProperty... tileProperties) {
		this(assetEnum, tileLayer, removeSound, tileProperties);
		this.movementCost = movementCost;
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

	public TextureEnum getTextureEnum() {
		return assetEnum;
	}

	public float getMovementCost() {
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

	public void playTileSound() {
		if (sound != null)
			Civilization.getInstance().getSoundHandler().playEffect(sound);
	}
}
