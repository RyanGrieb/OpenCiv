package me.rhin.openciv.server.game.map.tile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;

import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.GameMap;
import me.rhin.openciv.server.game.map.tile.TileType.TileLayer;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.map.tile.improvement.TileImprovement;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;
import me.rhin.openciv.shared.stat.Stat;
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
	private City territory;
	private ArrayList<Unit> units;
	private TileImprovement tileImprovement;
	private ArrayList<TileObserver> tileObservers;
	private String geograpgyName;

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
		this.tileObservers = new ArrayList<>();
	}

	@Override
	public String toString() {
		return getBaseTileType() + ": [" + gridX + "," + gridY + "]";
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

	public void addTileObserver(TileObserver tileObserver) {
		// Is hill
		boolean isHill = getBaseTileType() == TileType.GRASS_HILL || getBaseTileType() == TileType.DESERT_HILL
				|| getBaseTileType() == TileType.PLAINS_HILL;
		// Update visibility

		ArrayList<Tile> adjTiles = new ArrayList<>();
		adjTiles.add(this);
		for (Tile tile : getAdjTiles())
			adjTiles.add(tile);

		for (Tile tile : adjTiles) {

			if (tile == null)
				continue;

			boolean denyVisibility = false;
			for (TileTypeWrapper wrapper : tile.getTileTypeWrappers())
				if (wrapper.getTileType().getMovementCost() > 1 && !tile.equals(this)
						&& !tileObserver.ignoresTileObstructions()) {
					denyVisibility = true;
				}

			if (!tile.getTileObservers().contains(tileObserver)) {
				// tile.getTileObservers().add(tileObserver);
				tile.addTileObserverToList(tileObserver);
				// System.out.println(tileObserver.getName() + " - " + tile);

				if (!tileObserver.getObservedTiles().contains(tile))
					tileObserver.addObeservedTile(tile);
			}

			if (denyVisibility && !isHill) {
				continue;
			}

			for (Tile adjTile : tile.getAdjTiles()) {
				if (adjTile == null)
					continue;

				if (!adjTile.getTileObservers().contains(tileObserver)) {
					// adjTile.getTileObservers().add(tileObserver);
					adjTile.addTileObserverToList(tileObserver);
					// System.out.println(tileObserver.getName() + " - " + adjTile);

					if (!tileObserver.getObservedTiles().contains(adjTile))
						tileObserver.addObeservedTile(adjTile);
				}
			}

		}
	}

	private void addTileObserverToList(TileObserver tileObserver) {
		getTileObservers().add(tileObserver);

		AbstractPlayer playerOnTile = null;

		if (territory != null) {
			playerOnTile = territory.getPlayerOwner();
		}

		if (getTopUnit() != null) {
			playerOnTile = getTopUnit().getPlayerOwner();
		}

		// If there is a player on the tile that isn't the tileObserver..
		if (playerOnTile != null && !tileObserver.getPlayerOwner().equals(playerOnTile)) {

			if (!tileObserver.getPlayerOwner().getDiplomacy().getDiscoveredPlayers().contains(playerOnTile)) {
				// tileObserver.getPlayerOwner().getDiplomacy().getDiscoveredPlayers().add(playerOnTile);
				tileObserver.getPlayerOwner().getDiplomacy().addDiscoveredPlayer(playerOnTile);
				// System.out.println(tileObserver.getPlayerOwner().getName() + " Discovered " +
				// playerOnTile.getName());
			}

			if (!playerOnTile.getDiplomacy().getDiscoveredPlayers().contains(tileObserver.getPlayerOwner())) {
				// playerOnTile.getDiplomacy().getDiscoveredPlayers().add(tileObserver.getPlayerOwner());
				playerOnTile.getDiplomacy().addDiscoveredPlayer(tileObserver.getPlayerOwner());
				// System.out.println(playerOnTile.getName() + " Discovered " +
				// tileObserver.getPlayerOwner().getName());
			}

		}
	}

	public void removeTileObserver(TileObserver tileObserver) {
		// Update visibility

		ArrayList<Tile> adjTiles = new ArrayList<>();
		adjTiles.add(this);
		for (Tile tile : getAdjTiles())
			adjTiles.add(tile);

		for (Tile tile : adjTiles) {

			if (tile == null)
				continue;

			tile.getTileObservers().remove(tileObserver);
			tileObserver.removeObeservedTile(tile);

			for (Tile adjTile : tile.getAdjTiles()) {
				if (adjTile == null)
					continue;

				adjTile.getTileObservers().remove(tileObserver);
				tileObserver.removeObeservedTile(adjTile);
			}

		}
	}

	public ArrayList<TileObserver> getTileObservers() {
		return tileObservers;
	}

	public void addUnit(Unit unit) {
		units.add(unit);

		addTileObserver(unit);
	}

	public void setEdge(int index, Tile tile) {
		adjTiles[index] = tile;
	}

	public void removeUnit(Unit unit) {
		units.remove(unit);

		removeTileObserver(unit);
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
		for (int i = tileWrappers.size() - 1; i >= 0; i--) {
			if (((TileTypeWrapper) tileWrappers.toArray()[i]).getTileType() == TileType.ROAD)
				continue;
			return ((TileTypeWrapper) tileWrappers.toArray()[i]).getTileType();
		}

		return null;
		// return ((TileTypeWrapper) tileWrappers.toArray()[tileWrappers.size() -
		// 1]).getTileType();
	}

	public Set<TileTypeWrapper> getTileTypeWrappers() {
		return tileWrappers;
	}

	public boolean containsTileType(TileType... tileTypes) {
		for (TileType tileType : tileTypes)
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

		addTileObserver(city);
	}

	public void setTerritory(City territory) {
		this.territory = territory;

		addTileObserver(territory);
	}

	public City getTerritory() {
		return territory;
	}

	public Unit getUnitFromID(int unitID) {
		for (Unit unit : units)
			if (unit.getID() == unitID)
				return unit;

		return null;
	}

	public AttackableEntity getAttackableEntityFromID(int id) {
		if (id == -1)
			return city;

		for (Unit unit : units)
			if (unit.getID() == id)
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

			// Problem, have the highest tileLayer be everything.
			if (tileType.getTileLayer() == TileLayer.HIGH) {
				return tileType.getStatLine();
			}

			if ((tileType.getTileLayer() == TileLayer.MIDDLE || tileType.getTileLayer() == TileLayer.BASE)) {
				statLine.mergeStatLine(tileType.getStatLine());
			}
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

	public float getMovementCost() {

		if (containsTileType(TileType.ROAD))
			return 0.5F;

		// FIXME: This is wrong. We need to add up all the tileTypes accordingly.
		TileTypeWrapper topWrapper = ((TileTypeWrapper) tileWrappers.toArray()[tileWrappers.size() - 1]);
		if (topWrapper.getTileType().hasProperty(TileProperty.RESOURCE, TileProperty.IMPROVEMENT,
				TileProperty.LUXURY)) {
			return ((TileTypeWrapper) tileWrappers.toArray()[0]).getTileType().getMovementCost();
		} else
			return topWrapper.getTileType().getMovementCost();
	}

	public float getMovementCost(Tile prevTile) {

		if (prevTile.equals(this))
			return 0;

		float movementCost = 0;

		// Check if the tile were moving to has a river
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

		if (containsTileType(TileType.ROAD))
			movementCost = 0.5F;

		if (getMovementCost() > movementCost)
			movementCost = getMovementCost();

		// FIXME: Implement this. This is the civ 5 movement pattern.
		// if(movementCost > 1 && unit.getMovement() < 2)
		// movementCost = unit.getMovement();

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

	public int getTileDistanceFrom(Tile targetTile) {

		int width = Server.getInstance().getMap().getWidth();
		int height = Server.getInstance().getMap().getHeight();

		int h = 0;
		ArrayList<Tile> openSet = new ArrayList<>();
		Tile[][] cameFrom = new Tile[width][height];
		float[][] gScores = new float[width][height];
		float[][] fScores = new float[width][height];

		for (float[] gScore : gScores)
			Arrays.fill(gScore, width * height);
		for (float[] fScore : fScores)
			Arrays.fill(fScore, width * height);

		gScores[getGridX()][getGridY()] = 0;
		fScores[getGridX()][getGridY()] = h;
		openSet.add(this);

		while (openSet.size() > 0) {

			Tile current = removeSmallest(openSet, fScores);

			if (current.equals(targetTile))
				break;

			openSet.remove(current);
			for (Tile adjTile : current.getAdjTiles()) {
				if (adjTile == null)
					continue;

				float tenativeGScore = gScores[current.getGridX()][current.getGridY()];

				if (tenativeGScore < gScores[adjTile.getGridX()][adjTile.getGridY()]) {

					cameFrom[adjTile.getGridX()][adjTile.getGridY()] = current;
					gScores[adjTile.getGridX()][adjTile.getGridY()] = tenativeGScore;

					float adjFScore = gScores[adjTile.getGridX()][adjTile.getGridY()] + h;
					fScores[adjTile.getGridX()][adjTile.getGridY()] = adjFScore;
					if (!openSet.contains(adjTile)) {
						openSet.add(adjTile);
					}
				}
			}
		}

		// Iterate through the parent array to get back to the origin tile.

		Tile parentTile = cameFrom[targetTile.getGridX()][targetTile.getGridY()];

		// If it's moving to itself or there isn't a valid path
		if (parentTile == null) {
			return 0;
		}

		ArrayList<Tile> pathTiles = new ArrayList<>();

		if (targetTile != null && parentTile != null) {
			pathTiles.add(targetTile);
			pathTiles.add(parentTile);
		}

		while (parentTile != null) {
			Tile nextTile = cameFrom[parentTile.getGridX()][parentTile.getGridY()];

			if (nextTile == null)
				break;

			if (parentTile.equals(targetTile)) {
				break;
			}

			pathTiles.add(nextTile);

			parentTile = nextTile;
		}

		return pathTiles.size() - 1;
	}

	public Unit getTopUnit() {
		Unit topUnit = null;
		for (Unit unit : units) {
			if (topUnit == null || (topUnit.getUnitTypes().contains(UnitType.SUPPORT)
					&& !unit.getUnitTypes().contains(UnitType.SUPPORT)))
				topUnit = unit;
		}

		return topUnit;
	}

	public Unit getTopEnemyUnit(AbstractPlayer player) {
		Unit topUnit = null;
		for (Unit unit : units) {

			if (!player.getDiplomacy().atWar(unit.getPlayerOwner()))
				continue;

			if (topUnit == null || (topUnit.getUnitTypes().contains(UnitType.SUPPORT)
					&& !unit.getUnitTypes().contains(UnitType.SUPPORT)))
				topUnit = unit;
		}

		return topUnit;
	}

	public AttackableEntity getEnemyAttackableEntity(AbstractPlayer player) {

		// Problem: This can AND WILL pick up friendly units. Fixed by having to return
		// enemy cities first.
		if (city != null && player.getDiplomacy().atWar(city.getPlayerOwner()))
			return city;

		Unit unit = getTopEnemyUnit(player);
		if (unit != null)
			return unit;

		return null;
	}

	public AttackableEntity getAttackableEntity() {

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

	public Unit getCaptureableUnit(AttackableEntity attackingEntity) {
		Unit capturableUnit = null;
		for (Unit unit : units) {
			if (unit.getPlayerOwner().equals(attackingEntity.getPlayerOwner()))
				continue;

			if (unit.isUnitCapturable(attackingEntity.getPlayerOwner()))
				capturableUnit = unit;
		}

		return capturableUnit;
	}

	public void workTile(Unit unit, TileImprovement tileImprovement) {

		// FIXME: This should be called before the builder has a chance to work the tile
		if (tileImprovement.getRequiredTech() != null
				&& !unit.getPlayerOwner().getResearchTree().hasResearched(tileImprovement.getRequiredTech()))
			return;

		this.tileImprovement = tileImprovement;
		tileImprovement.setTile(this);

		tileImprovement.addTurnsWorked();

		if (tileImprovement.getTurnsWorked() >= tileImprovement.getMaxTurns()) {
			// Modify the tile here

			tileImprovement.improveTile();

			if (territory != null) {
				territory.addMorale(getStatLine().getStatValue(Stat.MORALE_TILE));
				territory.updateWorkedTiles();
			}

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

	// FIXME: A tile can have multiple improvements, such as a road & farm.
	public TileImprovement getTileImprovement() {
		return tileImprovement;
	}

	public void setTileImprovement(TileImprovement tileImprovement) {
		this.tileImprovement = tileImprovement;
	}

	public float getCombatModifier() {
		float combatModifier = 1;
		if (containsTileProperty(TileProperty.HILL))
			combatModifier -= 0.15;

		if (containsTileType(TileType.FOREST) || containsTileType(TileType.JUNGLE))
			combatModifier -= 0.10;

		if (containsTileType(TileType.FORT))
			combatModifier -= 0.25;

		return combatModifier;
	}

	public boolean isAdjToRiver() {
		for (boolean part : riverSides) {
			if (part)
				return true;
		}

		return false;
	}

	public ArrayList<Unit> getNearbyUnits() {
		ArrayList<Unit> units = new ArrayList<>();
		for (Tile tile1 : adjTiles) {
			units.addAll(tile1.getUnits());
			for (Tile tile2 : tile1.getAdjTiles()) {
				units.addAll(tile2.getUnits());
			}
		}
		return units;
	}

	public String getGeograpgyName() {
		return geograpgyName;
	}

	public void setGeographyName(String geograpgyName) {
		this.geograpgyName = geograpgyName;
	}

	// FIXME: Return arrayList?
	public Unit getUnitByType(UnitType unitType) {

		for (Unit unit : units) {
			if (unit.getUnitTypes().contains(unitType))
				return unit;
		}

		return null;
	}

	public boolean containsUnitTypes(List<UnitType> unitTypes) {

		for (Unit unit : units) {
			for (UnitType unitType : unitTypes) {
				if (unit.getUnitTypes().contains(unitType))
					return true;
			}
		}

		return false;
	}

	// FIXME: Redundant code found in Unit.class
	private Tile removeSmallest(ArrayList<Tile> queue, float fScore[][]) {
		float smallest = Integer.MAX_VALUE;
		Tile smallestTile = null;
		for (Tile tile : queue) {
			if (fScore[tile.getGridX()][tile.getGridY()] < smallest) {
				smallest = fScore[tile.getGridX()][tile.getGridY()];
				smallestTile = tile;
			}
		}

		queue.remove(smallestTile);
		return smallestTile;
	}
}
