package me.rhin.openciv.asset;

import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.graphics.g2d.TextureAtlas;
import com.badlogic.gdx.graphics.g2d.TextureAtlas.AtlasRegion;

import me.rhin.openciv.Civilization;

public enum TextureEnum {

	TILE_AIR,
	TILE_GRASS,
	TILE_GRASS_HILL,
	TILE_PLAINS,
	TILE_PLAINS_HILL,
	TILE_DESERT,
	TILE_FLOODPLAINS,
	TILE_DESERT_HILL,
	TILE_TUNDRA,
	TILE_TUNDRA_HILL,
	TILE_OCEAN,
	TILE_SHALLOW_OCEAN,
	TILE_FOREST,
	TILE_JUNGLE,
	TILE_MOUNTIAN,
	TILE_HORSES,
	TILE_IRON,
	TILE_COPPER,
	TILE_COTTON,
	TILE_GEMS,
	TILE_FARM,
	TILE_GEMS_IMPROVED,
	TILE_CATTLE,
	TILE_CATTLE_IMPROVED,
	TILE_SILVER,
	TILE_SILVER_IMPROVED,
	TILE_COTTON_IMPROVED,
	TILE_ORANGES,
	TILE_HORSES_IMPROVED,
	TILE_IRON_IMPROVED,
	TILE_COPPER_IMPROVED,
	TILE_GRASS_HILL_MINE,
	TILE_PLAINS_HILL_MINE,
	TILE_DESERT_HILL_MINE,
	TILE_TUNDRA_HILL_MINE,
	TILE_CITY,
	TILE_RIVER,
	TILE_SELECT,
	TILE_UNDISCOVERED,
	TILE_NON_VISIBLE,
	UNIT_SETTLER,
	UNIT_WARRIOR,
	UNIT_SCOUT,
	UNIT_GALLEY,
	UNIT_BUILDER,
	UNIT_WORK_BOAT,
	UNIT_ARCHER,
	BUILDING_MONUMENT,
	BUILDING_MARKET,
	BUILDING_GRANARY,
	ICON_SCIENCE,
	ICON_HERITAGE,
	ICON_GOLD,
	ICON_FAITH,
	ICON_FOOD,
	ICON_PRODUCTION,
	ICON_CITIZEN,
	ICON_CITIZEN_LOCKED,
	ICON_CITIZEN_UNWORKED,
	ICON_CITIZEN_CITY_CENTER,
	ICON_UNEMPLOYED_CITIZEN,
	ICON_UNKNOWN,
	ICON_ENGLAND,
	ICON_AMERICA,
	ICON_ROME,
	ICON_GERMANY,
	ICON_MINING,
	UI_SELECTION,
	UI_BUTTON,
	UI_BUTTON_HOVERED,
	UI_BUTTON_SMALL,
	UI_BUTTON_SMALL_HOVERED,
	UI_BUTTON_DISABLED,
	UI_BLACK,
	UI_GRAY,
	UI_GREEN,
	UI_RED,
	UI_YELLOW,
	UI_LIGHT_GRAY,
	UI_LIGHTER_GRAY,
	UI_DARK_GRAY,
	UI_GITHUB,
	UI_BACKGROUND,
	UI_CONTAINER_BOX,
	UI_STAR,
	UI_ERROR;

	private TextureAtlas textureAtlas;

	private TextureEnum() {
		String assetType = this.name().toLowerCase().substring(0, this.name().toLowerCase().indexOf('_'));
		this.textureAtlas = Civilization.getInstance().getAssetHandler().get("atlas/" + assetType + ".atlas",
				TextureAtlas.class);
	}

	public String getPath() {
		return this.name().toLowerCase() + ".png";
	}

	public Sprite sprite() {
		Sprite sprite = textureAtlas.createSprite(this.name().toLowerCase());
		return sprite;
	}

	public AtlasRegion texture() {
		AtlasRegion texture = textureAtlas.findRegion(this.name().toLowerCase());
		return texture;
	}
}
