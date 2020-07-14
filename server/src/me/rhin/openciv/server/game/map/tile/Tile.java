package me.rhin.openciv.server.game.map.tile;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.PriorityQueue;

import com.badlogic.gdx.math.Vector2;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.GameMap;
import me.rhin.openciv.server.game.map.tile.TileType.TileLayer;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.shared.stat.StatLine;

public class Tile {

	public class TileTypeWrapper implements Comparable<TileTypeWrapper> {

		private TileType tileType;

		public TileTypeWrapper(TileType tileType) {
			this.tileType = tileType;
		}

		@Override
		public int compareTo(TileTypeWrapper type) {
			return tileType.getTileLayer().ordinal() - type.getTileType().getTileLayer().ordinal();
		}

		public TileType getTileType() {
			return tileType;
		}
	}

	private static final int SIZE = 16;

	private GameMap map;
	private PriorityQueue<TileTypeWrapper> tileWrappers;
	private StatLine statLine;
	private float x, y, width, height;
	private int gridX, gridY;
	private Tile[] adjTiles;
	private Vector2[] vectors;
	private City city;
	private ArrayList<Unit> units;

	public Tile(GameMap map, TileType tileType, float x, float y) {
		this.map = map;
		this.tileWrappers = new PriorityQueue<>();
		tileWrappers.add(new TileTypeWrapper(tileType));
		this.statLine = getStatLine();
		this.x = x;
		this.y = y;
		this.gridX = (int) x;
		this.gridY = (int) y;
		initializeVectors();
		this.adjTiles = new Tile[6];
		this.units = new ArrayList<>();
	}

	public float getWidth() {
		return width;
	}

	public float getHeight() {
		return height;
	}

	public float getX() {
		return x;
	}

	public float getY() {
		return y;
	}

	public int getGridX() {
		return gridX;
	}

	public int getGridY() {
		return gridY;
	}

	public GameMap getMap() {
		return map;
	}

	public void setTileType(TileType tileType) {
		if (tileType == null)
			return;

		if (containsTileLayer(tileType.getTileLayer())) {
			for (TileTypeWrapper tileWrapper : tileWrappers) {
				// Find the tileType /w the exact layer and replace it.
				if (tileWrapper.getTileType().getTileLayer() == tileType.getTileLayer())
					tileWrappers.remove(tileWrapper);
			}
		}
		// Add the tileType to the Array in an ordered manner. note: this will never be
		// a baseTile
		tileWrappers.add(new TileTypeWrapper(tileType));
	}

	public void addUnit(Unit unit) {
		units.add(unit);
	}

	public void setEdge(int index, Tile tile) {
		adjTiles[index] = tile;
	}

	public void removeUnit(Unit unit) {
		units.remove(unit);
	}

	public boolean hasUnitSelected() {
		for (Unit unit : units)
			if (unit.isSelected())
				return true;

		return false;
	}

	public Unit getSelectedUnit() {
		for (Unit unit : units)
			if (unit.isSelected())
				return unit;

		return null;
	}

	public ArrayList<Unit> getUnits() {
		return units;
	}

	public TileType getBaseTileType() {
		return ((TileTypeWrapper) tileWrappers.toArray()[tileWrappers.size() - 1]).getTileType();
	}

	public PriorityQueue<TileTypeWrapper> getTileTypeWrappers() {
		return tileWrappers;
	}

	public boolean containsTileType(TileType tileType) {
		for (TileTypeWrapper tileWrapper : tileWrappers)
			if (tileWrapper.getTileType() == tileType)
				return true;

		return false;
	}

	public Vector2[] getVectors() {
		return vectors;
	}

	public Tile[] getAdjTiles() {
		return adjTiles;
	}

	private void initializeVectors() {
		this.vectors = new Vector2[6];

		float xOrigin = 0;
		float yOrigin = 0;

		float vX0 = xOrigin + SIZE; // True starting point, at the bottom of the hex.

		vectors[0] = new Vector2(vX0, yOrigin);

		float vX1 = vX0 + (float) (Math.cos(Math.toRadians(30)) * SIZE);
		float vY1 = yOrigin + (float) (Math.sin(Math.toRadians(30)) * SIZE);
		vectors[1] = new Vector2(vX1, vY1);

		vectors[2] = new Vector2(vX1, vY1 + SIZE);

		float vX3 = vectors[2].x + (float) (Math.cos(Math.toRadians(150)) * SIZE);
		float vY3 = vectors[2].y + (float) (Math.sin(Math.toRadians(150)) * SIZE);

		vectors[3] = new Vector2(vX3, vY3);

		float vX4 = vectors[3].x + (float) (Math.cos(Math.toRadians(210)) * SIZE);
		float vY4 = vectors[3].y + (float) (Math.sin(Math.toRadians(210)) * SIZE);

		vectors[4] = new Vector2(vX4, vY4);

		vectors[5] = new Vector2(vX4, vY4 - SIZE);

		this.width = vectors[1].x - vectors[5].x;
		this.height = vectors[1].y + SIZE;

		for (Vector2 vector : vectors) {
			if (this.y % 2 == 0) {
				vector.x += (this.x * width);
				vector.y += (this.y * height); // wrong
			} else {
				vector.x += ((this.x + 0.5) * width);
				vector.y += ((this.y) * height);
			}
		}

		// Reset the y postion to the actual non-grid position.
		this.x = vectors[0].x - width / 2;
		this.y = vectors[0].y;
	}

	public void setCity(City city) {
		this.city = city;
		setTileType(TileType.CITY);
	}

	public Unit getUnitFromID(int unitID) {
		for (Unit unit : units)
			if (unit.getID() == unitID)
				return unit;

		return null;
	}

	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		Iterator<TileTypeWrapper> iterator = tileWrappers.iterator();

		while (iterator.hasNext()) {
			TileType tileType = iterator.next().getTileType();

			// Skip over the base layer, since the layered tile overrides the base layer.
			if (containsTileLayer(TileLayer.MIDDLE) && !containsTileType(TileType.CITY)
					&& tileType.getTileLayer() == TileLayer.BASE) {
				tileType = iterator.next().getTileType();
			}

			statLine.mergeStatLine(tileType.getStatLine());
		}

		return statLine;
	}

	public boolean onlyHasTileType(TileType tileType) {
		boolean containsTileType = false;

		for (TileTypeWrapper tileWrapper : tileWrappers) {
			if (tileWrapper.getTileType() == tileType)
				containsTileType = true;
		}

		return containsTileType && tileWrappers.size() < 2;
	}

	public boolean containsTileProperty(TileProperty... tileProperties) {
		for (TileTypeWrapper tileWrapper : tileWrappers) {
			for (TileProperty tileProperty : tileProperties)
				if (tileWrapper.getTileType().hasProperty(tileProperty))
					return true;
		}

		return false;
	}

	public boolean containsTileLayer(TileLayer tileLayer) {
		for (TileTypeWrapper tileWrapper : tileWrappers) {
			if (tileWrapper.getTileType().getTileLayer() == tileLayer)
				return true;
		}

		return false;
	}

	public int getMovementCost() {
		return ((TileTypeWrapper) tileWrappers.toArray()[tileWrappers.size() - 1]).getTileType().getMovementCost();
	}
}
