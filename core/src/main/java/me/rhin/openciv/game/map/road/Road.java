package me.rhin.openciv.game.map.road;

import me.rhin.openciv.game.map.tile.Tile;

public class Road {

	private Tile originTile;
	private Tile targetTile;
	private Tile prevTile;
	private RoadPart roadPart;

	public Road(Tile originTile) {
		this.originTile = originTile;
	}

	public void setDirection(Tile prevTile, Tile targetTile) {

		if (prevTile == null && targetTile != null) {
			prevTile = targetTile;
			targetTile = null;
		}

		this.targetTile = targetTile;
		this.prevTile = prevTile;

		defineRoadEnum();
	}

	public Tile getTargetTile() {
		return targetTile;
	}

	public Tile getPrevTile() {
		return prevTile;
	}

	public RoadPart getRoadPart() {
		return roadPart;
	}

	public Tile getOriginTile() {
		return originTile;
	}

	private void defineRoadEnum() {
		int prevTileIndex = -1;
		int targetTileIndex = -1;

		for (int i = 0; i < originTile.getAdjTiles().length; i++) {
			if (originTile.getAdjTiles()[i].equals(prevTile))
				prevTileIndex = i;
		}

		for (int i = 0; i < originTile.getAdjTiles().length; i++) {
			if (originTile.getAdjTiles()[i].equals(targetTile))
				targetTileIndex = i;
		}

		if (prevTile == null) {
			prevTileIndex = 5; // Default to a horizontal axis.
		}

		// Just set our index to the opposite side of the previous tile
		if (targetTile == null) {
			switch (prevTileIndex) {
			case 0:
				targetTileIndex = 3;
				break;
			case 1:
				targetTileIndex = 4;
				break;
			case 2:
				targetTileIndex = 5;
				break;
			case 3:
				targetTileIndex = 0;
				break;
			case 4:
				targetTileIndex = 1;
				break;
			case 5:
				targetTileIndex = 2;
				break;
			}
		}

		this.roadPart = RoadPart.fetchRoadPart(prevTileIndex, targetTileIndex);
	}
}
