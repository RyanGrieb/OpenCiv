package me.rhin.openciv.server.game.map.tile;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.ListIterator;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;

import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.GameMap;
import me.rhin.openciv.server.game.map.tile.TileType.TileLayer;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.map.tile.improvement.TileImprovement;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;
import me.rhin.openciv.shared.stat.StatLine;

public class Tile {

	public class TileTypeWrapper implements Comparable<TileTypeWrapper> {

		private TileType tileType;

		public TileTypeWrapper(TileType tileType) {
			this.tileType = tileType;
		}

		@Override
		public boolean equals(Object o) {
			if (this == o)
				return true;
			if (o == null || getClass() != o.getClass())
				return false;
			TileTypeWrapper wrapper = (TileTypeWrapper) o;

			return tileType == wrapper.getTileType();
		}

		@Override
		public int compareTo(TileTypeWrapper type) {
			return tileType.getTileLayer().ordinal() - type.getTileType().getTileLayer().ordinal();
		}

		@Override
		public int hashCode() {
			return Objects.hash(tileType.getTileLayer().ordinal());
		}

		public TileType getTileType() {
			return tileType;
		}
	}

	private static final int SIZE = 16;

	private GameMap map;
	private Set<TileTypeWrapper> tileWrappers;
	private float x, y, width, height;
	private int gridX, gridY;
	private Tile[] adjTiles;
	private boolean[] riverSides;
	private Vector2[] vectors;
	private City city;
	private ArrayList<Unit> units;
	private TileImprovement tileImprovement;

	public Tile(GameMap map, TileType tileType, float x, float y) {
		this.map = map;
		this.tileWrappers = Collections.synchronizedSet(new TreeSet<TileTypeWrapper>());
		tileWrappers.add(new TileTypeWrapper(tileType));
		this.x = x;
		this.y = y;
		this.gridX = (int) x;
		this.gridY = (int) y;
		initializeVectors();
		this.adjTiles = new Tile[6];
		this.riverSides = new boolean[6];
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
			Iterator<TileTypeWrapper> iterator = tileWrappers.iterator();

			while (iterator.hasNext()) {
				TileTypeWrapper tileWrapper = iterator.next();

				// Find the tileType /w the exact layer and replace it.

				if (tileWrapper.getTileType().getTileLayer() == tileType.getTileLayer())
					iterator.remove();

				for (Tile adjTile : getAdjTiles()) {
					if (adjTile == null)
						continue;

					TileType adjTileType = tileWrapper.getTileType(); // One we remove.

					// Check if we are still adjacent to that tile type
					boolean removeAdjTile = true;
					for (Tile exteriorTile : adjTile.getAdjTiles()) {

						if (exteriorTile == null)
							continue;

						if (exteriorTile.containsTileType(adjTileType))
							removeAdjTile = false;
					}

					if (removeAdjTile)
						Server.getInstance().getMap().getTileIndexer().removeAdjacentTileType(adjTile,
								tileWrapper.getTileType());
				}
			}

		}
		// Add the tileType to the Array in an ordered manner. note: this will never be
		// a baseTile

		for (Tile adjTile : getAdjTiles()) {
			if (adjTile == null)
				continue;
			Server.getInstance().getMap().getTileIndexer().setAdjacentTileType(adjTile, tileType);
		}

		Server.getInstance().getMap().getTileIndexer().setTilePropertfyOf(this, tileType.getProperties());

		tileWrappers.add(new TileTypeWrapper(tileType));
	}

	public void removeTileType(TileType tileType) {

		if (tileType == null || !containsTileType(tileType))
			return;

		for (Tile adjTile : getAdjTiles()) {
			if (adjTile == null)
				continue;

			TileType adjTileType = tileType; // TileType we are removing

			// Check if we are still adjacent to that tile type
			boolean removeAdjTile = true;
			for (Tile exteriorTile : adjTile.getAdjTiles()) {

				if (exteriorTile == null)
					continue;

				if (exteriorTile.containsTileType(adjTileType))
					removeAdjTile = false;
			}

			if (removeAdjTile)
				Server.getInstance().getMap().getTileIndexer().removeAdjacentTileType(adjTile, tileType);
		}

		Server.getInstance().getMap().getTileIndexer().removeTilePropertyOf(this, tileType.getProperties());

		// FIXME: Remove from set.
		Iterator<TileTypeWrapper> iterator = tileWrappers.iterator();

		while (iterator.hasNext()) {
			TileTypeWrapper tileWrapper = iterator.next();

			if (tileWrapper.getTileType().getTileLayer() == tileType.getTileLayer())
				iterator.remove();
		}
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

	public Set<TileTypeWrapper> getTileTypeWrappers() {
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

			// Skip over the high layer, since the layered tile overrides the base
			// layer.
			if (containsTileLayer(TileLayer.HIGH) && !containsTileType(TileType.CITY)
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
		// FIXME: This is wrong. We need to add up all the tileTypes accordingly.
		TileTypeWrapper topWrapper = ((TileTypeWrapper) tileWrappers.toArray()[tileWrappers.size() - 1]);
		if (topWrapper.getTileType().hasProperty(TileProperty.RESOURCE, TileProperty.IMPROVEMENT,
				TileProperty.LUXURY)) {
			return ((TileTypeWrapper) tileWrappers.toArray()[0]).getTileType().getMovementCost();
		} else
			return topWrapper.getTileType().getMovementCost();
	}

	public int getMovementCost(Tile prevTile) {

		int movementCost = 0;

		// Check if the tile were moving to
		int currentSideCheck = -1;
		for (int i = 0; i < adjTiles.length; i++) {
			if (prevTile.equals(adjTiles[i])) {
				currentSideCheck = i;
			}
		}

		if (riverSides[currentSideCheck]) {
			movementCost = 2;
		}

		// Check if the tile were moving from has a river
		int prevSideCheck = -1;
		for (int i = 0; i < prevTile.adjTiles.length; i++) {
			if (this.equals(prevTile.adjTiles[i])) {
				prevSideCheck = i;
			}
		}

		if (prevTile.getRiverSides()[prevSideCheck]) {
			movementCost = 2;
		}

		if (getMovementCost() > movementCost)
			movementCost = getMovementCost();

		return movementCost;

	}

	public void addRiverToSide(int side) {
		this.riverSides[side] = true;
		Server.getInstance().getMap().getTileIndexer().setAdjacentRiverTile(this);
	}

	public boolean[] getRiverSides() {
		return riverSides;
	}

	public boolean hasRivers() {
		for (boolean riverSide : riverSides)
			if (riverSide)
				return true;

		return false;
	}

	public float getDistanceFrom(Tile originTile) {

		float x1 = getX() + (getWidth() / 2);
		float x2 = originTile.getX() + (originTile.getWidth() / 2);
		float y1 = getY() + (getHeight() / 2);
		float y2 = originTile.getY() + (originTile.getHeight() / 2);

		return (float) Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));

	}

	public Unit getTopUnit() {
		Unit topUnit = null;
		for (Unit unit : units) {
			if (topUnit == null || topUnit.getCombatStrength() < unit.getCombatStrength())
				topUnit = unit;
		}

		return topUnit;
	}

	public AttackableEntity getAttackableEntity() {

		// Problem: This can AND WILL pick up friendly units. Fixed by having to return
		// enemy cities first.
		if (city != null)
			return city;

		Unit unit = getTopUnit();
		if (unit != null)
			return unit;

		return null;
	}

	public City getCity() {
		return city;
	}

	public Unit getCaptureableUnit() {
		Unit capturableUnit = null;
		for (Unit unit : units) {
			if (unit.isUnitCapturable())
				capturableUnit = unit;
		}

		return capturableUnit;
	}

	public void workTile(Unit unit, String improvementName) {
		if (tileImprovement == null) {
			System.out.println(getBaseTileType());
			tileImprovement = getBaseTileType().getImprovement(improvementName);
			tileImprovement.setTile(this);
		}

		if (tileImprovement == null) {
			System.out.println("Tile: Error, no tile improvement found for " + getBaseTileType().name());
			return;
		}

		tileImprovement.addTurnsWorked();

		if (tileImprovement.getTurnsWorked() >= tileImprovement.getMaxTurns()) {

			// Modify the tile here
			tileImprovement.improveTile();

			// FIXME: We need to update the city worked tiles

		} else {
			// Continue to work the tile
			Json json = new Json();

			WorkTilePacket workTilePacket = new WorkTilePacket();
			workTilePacket.setTile(tileImprovement.getName().toLowerCase(), gridX, gridY,
					tileImprovement.getTurnsWorked(), unit.getID());

			for (Player player : Server.getInstance().getPlayers())
				player.getConn().send(json.toJson(workTilePacket));

		}
	}

	public TileImprovement getTileImprovement() {
		return tileImprovement;
	}

	public void setTileImprovement(TileImprovement tileImprovement) {
		this.tileImprovement = tileImprovement;
	}
}
