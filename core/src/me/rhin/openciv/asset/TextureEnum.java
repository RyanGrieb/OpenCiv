package me.rhin.openciv.asset;

import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.graphics.g2d.TextureAtlas;

import me.rhin.openciv.Civilization;

public enum TextureEnum {

	TILE_GRASS,
	TILE_GRASS_HILL,
	TILE_OCEAN,
	TILE_SHALLOW_OCEAN, 
	TILE_FOREST, 
	TILE_MOUNTIAN, 
	TILE_SELECT,
	UNIT_SETTLER, 
	UNIT_WARRIOR,
	UNIT_SCOUT,
	ICON_RESEARCH,
	ICON_HERITAGE,
	ICON_GOLD,
	ICON_FATIH,
	UI_SELECTION, 
	UI_BUTTON,
	UI_BUTTON_HOVERED,
	UI_BLACK,
	UI_GITHUB;

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

}
