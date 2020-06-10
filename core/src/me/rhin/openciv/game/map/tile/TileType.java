package me.rhin.openciv.game.map.tile;

import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;

public enum TileType {
	GRASS(TextureEnum.TILE_GRASS), GRASS_HILL(TextureEnum.TILE_GRASS_HILL, 2), OCEAN(TextureEnum.TILE_OCEAN, true),
	SHALLOW_OCEAN(TextureEnum.TILE_SHALLOW_OCEAN, true), MOUNTAIN(TextureEnum.TILE_MOUNTIAN, 1000000),
	FOREST(TextureEnum.TILE_FOREST, 2);

	private TextureEnum assetEnum;
	private boolean isWater;
	private int movementCost;

	TileType(TextureEnum assetEnum) {
		this.assetEnum = assetEnum;
		this.movementCost = 1;
	}

	TileType(TextureEnum assetEnum, boolean isWater) {
		this.assetEnum = assetEnum;
		this.movementCost = 1;
		this.isWater = isWater;
	}

	TileType(TextureEnum assetEnum, int movementCost) {
		this.assetEnum = assetEnum;
		this.movementCost = movementCost;
	}

	public static TileType fromId(int i) {
		return values()[i];
	}

	public Sprite sprite() {
		return assetEnum.sprite();
	}

	public int getMovementCost() {
		// TODO: Could we accept a unit parameter and change it based on the type?
		return movementCost;
	}

	public boolean isWater() {
		return isWater;
	}
}
