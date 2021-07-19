package me.rhin.openciv.game.map.road;

import me.rhin.openciv.asset.TextureEnum;

public enum RoadPart {

	HORIZONTAL(TextureEnum.ROAD_HORIZONTAL, new int[] { 2, 5 }, new int[] { 5, 2 }),
	HORIZONTAL_BOTTOMLEFT(TextureEnum.ROAD_HORIZONTAL_BOTTOMLEFT, new int[] { 0, 2 }, new int[] { 2, 0 }),
	HORIZONTAL_BOTTOMRIGHT(TextureEnum.ROAD_HORIZONTAL_BOTTOMRIGHT, new int[] { 1, 5 }, new int[] { 5, 1 }),
	VERTICAL_RIGHT(TextureEnum.ROAD_VERTICAL_RIGHT, new int[] { 0, 3 }, new int[] { 3, 0 }),
	VERTICAL_LEFT(TextureEnum.ROAD_VERTICAL_LEFT, new int[] { 1, 4 }, new int[] { 4, 1 }),
	VERTICAL_CORNERRIGHT(TextureEnum.ROAD_VERTICAL_CORNERRIGHT, new int[] { 1, 3 }, new int[] { 3, 1 }),
	VERTICAL_CORNERLEFT(TextureEnum.ROAD_VERTICAL_CORNERLEFT, new int[] { 0, 4 }, new int[] { 4, 0 }),
	VERTICAL_CORNERBOTTOM(TextureEnum.ROAD_VERTICAL_CORNERBOTTOM, new int[] { 0, 1 }, new int[] { 1, 0 }),
	VERTICAL_CORNERTOP(TextureEnum.ROAD_VERTICAL_CORNERTOP, new int[] { 3, 4 }, new int[] { 4, 3 }),
	HORIZONTAL_TOPLEFT(TextureEnum.ROAD_HORIZONTAL_TOPLEFT, new int[] { 2, 4 }, new int[] { 4, 2 }),
	HORIZONTAL_TOPRIGHT(TextureEnum.ROAD_HORIZONTAL_TOPRIGHT, new int[] { 3, 5 }, new int[] { 5, 3 }),
	HORIZONTAL_CORNERBOTTOMLEFT(TextureEnum.ROAD_HORIZONTAL_CORNERBOTTOMLEFT, new int[] { 0, 5 }, new int[] { 5, 0 }),
	HORIZONTAL_CORNERBOTTOMRIGHT(TextureEnum.ROAD_HORIZONTAL_CORNERBOTTOMRIGHT, new int[] { 1, 2 }, new int[] { 2, 1 }),
	HORIZONTAL_CORNERTOPLEFT(TextureEnum.ROAD_HORIZONTAL_CORNERTOPLEFT, new int[] { 4, 5 }, new int[] { 5, 4 }),
	HORIZONTAL_CORNERTOPRIGHT(TextureEnum.ROAD_HORIZONTAL_CORNERTOPRIGHT, new int[] { 2, 3 }, new int[] { 3, 2 });

	private TextureEnum textureEnum;
	private int[] prevIndexes;
	private int[] targetIndexes;

	RoadPart(TextureEnum texture, int[] prevs, int[] targets) {
		this.textureEnum = texture;
		this.prevIndexes = prevs;
		this.targetIndexes = targets;
	}

	public int[] getTargetIndexes() {
		return targetIndexes;
	}

	public int[] getPrevIndexes() {
		return prevIndexes;
	}

	public TextureEnum getTexture() {
		return textureEnum;
	}

	public static RoadPart fetchRoadPart(int prevTileIndex, int targetTileIndex) {
		for (RoadPart roadPart : values()) {

			boolean prevIndexMatch = false;
			boolean targetIndexMatch = false;

			for (int prev : roadPart.prevIndexes) {
				if (prevTileIndex == prev)
					prevIndexMatch = true;
			}

			for (int target : roadPart.targetIndexes)
				if (targetTileIndex == target)
					targetIndexMatch = true;

			if (targetIndexMatch && prevIndexMatch)
				return roadPart;

		}

		return null;
	}
}
