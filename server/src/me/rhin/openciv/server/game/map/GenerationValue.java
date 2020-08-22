package me.rhin.openciv.server.game.map;

import me.rhin.openciv.server.game.map.tile.Tile.TileTypeWrapper;

public class GenerationValue implements Comparable<GenerationValue> {

	private GenerationValue[] adjGenerationValues;
	private int value;
	private int gridX, gridY;

	public GenerationValue(int value, int x, int y) {
		this.adjGenerationValues = new GenerationValue[6];

		this.value = value;
		this.gridX = x;
		this.gridY = y;
	}

	@Override
	public int compareTo(GenerationValue type) {
		return value - type.getValue();
	}

	public void setEdge(int index, GenerationValue adjGenerationValue) {
		adjGenerationValues[index] = adjGenerationValue;
	}

	public void setValue(int value) {
		this.value = value;
	}

	public int getValue() {
		return value;
	}

	public GenerationValue[] getAdjGenerationValues() {
		return adjGenerationValues;
	}

	public int getGridX() {
		return gridX;
	}

	public int getGridY() {
		return gridY;
	}
}
