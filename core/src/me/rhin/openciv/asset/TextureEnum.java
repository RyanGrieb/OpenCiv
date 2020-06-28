package me.rhin.openciv.asset;

import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.graphics.g2d.TextureAtlas;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.shared.stat.Stat;

public enum TextureEnum {

	TILE_GRASS,
	TILE_GRASS_HILL,
	TILE_PLAINS,
	TILE_PLAINS_HILL,
	TILE_OCEAN,
	TILE_SHALLOW_OCEAN, 
	TILE_FOREST, 
	TILE_MOUNTIAN,
	TILE_CITY,
	TILE_SELECT,
	UNIT_SETTLER, 
	UNIT_WARRIOR,
	UNIT_SCOUT,
	ICON_RESEARCH,
	ICON_HERITAGE,
	ICON_GOLD,
	ICON_FATIH,
	ICON_FOOD,
	ICON_PRODUCTION,
	UI_SELECTION, 
	UI_BUTTON,
	UI_BUTTON_HOVERED,
	UI_BLACK,
	UI_GRAY,
	UI_GITHUB,
	UI_BACKGROUND,
	UI_CONTAINER_BOX;

	private TextureAtlas textureAtlas;

	TextureEnum() {

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

	public static TextureEnum fromStat(Stat stat) {
		// FIXME: This seems hackish, and the stat class should really handle this.
		// But I want to keep the stat class shared b/w the client & server.
		String name = null;
		if (stat.name().contains("_")) {
			name = stat.name().substring(0, stat.name().indexOf('_')).toUpperCase();
		} else {
			name = stat.name().toUpperCase();
		}
		return TextureEnum.valueOf("ICON_" + name);
	}

}
