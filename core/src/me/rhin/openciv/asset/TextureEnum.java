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
	TILE_CITY,
	TILE_SELECT,
	UNIT_SETTLER,
	UNIT_WARRIOR,
	UNIT_SCOUT,
	UNIT_GALLEY,
	ICON_RESEARCH,
	ICON_HERITAGE,
	ICON_GOLD,
	ICON_FATIH,
	ICON_FOOD,
	ICON_PRODUCTION,
	ICON_CITIZEN,
	ICON_CITIZEN_LOCK,
	ICON_CITIZEN_UNWORKED,
	ICON_CITIZEN_CITY_CENTER,
	UI_SELECTION,
	UI_BUTTON,
	UI_BUTTON_HOVERED,
	UI_BLACK,
	UI_GRAY,
	UI_GREEN,
	UI_LIGHT_GRAY,
	UI_DARK_GRAY,
	UI_GITHUB,
	UI_BACKGROUND,
	UI_CONTAINER_BOX,
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
