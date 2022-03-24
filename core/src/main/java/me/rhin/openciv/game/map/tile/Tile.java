package me.rhin.openciv.game.map.tile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Iterator;
import java.util.TreeSet;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.GameMap;
import me.rhin.openciv.game.map.RiverPart;
import me.rhin.openciv.game.map.road.Road;
import me.rhin.openciv.game.map.tile.TileType.TileLayer;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.unit.AttackableEntity;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem.UnitType;
import me.rhin.openciv.listener.BottomShapeRenderListener;
import me.rhin.openciv.shared.logging.Logger;
import me.rhin.openciv.shared.logging.LoggerFactory;
import me.rhin.openciv.shared.logging.LoggerType;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.type.InGameScreen;

public class Tile extends Actor {

	public class TileTypeWrapper extends Sprite implements Comparable<TileTypeWrapper> {

		private TileType tileType;

		public TileTypeWrapper(TileType tileType) {
			super(tileType.texture());
			this.tileType = tileType;
		}

		public TileTypeWrapper(TileType tileType, float x, float y, float width, float height) {
			this(tileType);
			this.setBounds(x, y, width, height);
		}

		public TileTypeWrapper(float x, float y, float width, float height) {
			this.setBounds(x, y, width, height);
		}

		@Override
		public int compareTo(TileTypeWrapper tileTypeWrapper) {
			return tileType.getTileLayer().ordinal() - tileTypeWrapper.getTileType().getTileLayer().ordinal();
		}

		public TileType getTileType() {
			return tileType;
		}

		public void setTileType(TileType tileType) {
			this.tileType = tileType;
		}

		public void setSprite(TextureEnum textureEnum) {
			this.setRegion(textureEnum.texture());
		}
	}

	private static final Logger LOGGER = LoggerFactory.getInstance(LoggerType.LOG_TAG);

	private static final int SIZE = 16;
	private static final int SPRITE_WIDTH = 28;
	private static final int SPRITE_HEIGHT = 32;

	private GameMap map;
	private TreeSet<TileTypeWrapper> tileWrappers;
	private Sprite territorySprite;
	private Sprite selectionSprite;
	private Sprite fogSprite;
	private Sprite nonVisibleSprite;
	private Sprite rangedTargetSprite;
	private boolean[] territoryBorders;
	private boolean drawSelection;
	private CustomLabel observerLabel;
	private float x, y, width, height;
	private int gridX, gridY;
	private Vector2[] vectors;
	private Tile[] adjTiles;
	private RiverPart[] riverSides;
	private City city;
	private City territory;
	private ArrayList<Unit> units;
	private boolean discovered;
	private ArrayList<TileObserver> tileObservers;
	private ArrayList<TileObserver> serverObservers; // All units from server observing this tile
	private boolean improved;
	private int appliedImprovementTurns;
	private boolean rangedTarget;
	private Road road;

	public Tile(GameMap map, TileType tileType, float x, float y) {
		this.map = map;
		if (tileType.getTileLayer() != TileLayer.BASE) {
			LOGGER.info("WARNING: TileType " + tileType.name() + " top layer applied to constructor");
		}
		this.tileWrappers = new TreeSet<>();
		tileWrappers.add(new TileTypeWrapper(tileType));

		this.selectionSprite = new Sprite(TextureEnum.TILE_SELECT.sprite());
		selectionSprite.setAlpha(0.2f);
		this.territorySprite = new Sprite(TextureEnum.TILE_SELECT.sprite());
		this.territoryBorders = new boolean[6];

		this.rangedTargetSprite = new Sprite(TextureEnum.TILE_SELECT.sprite());
		rangedTargetSprite.setColor(Color.RED);
		rangedTargetSprite.setAlpha(0.25f);

		this.fogSprite = new Sprite(TextureEnum.TILE_UNDISCOVERED.sprite());
		this.nonVisibleSprite = new Sprite(TextureEnum.TILE_NON_VISIBLE.sprite());
		nonVisibleSprite.setAlpha(0.7f);

		this.drawSelection = false;
		this.improved = false;
		this.rangedTarget = false;

		// FIXME: Remove our own x,y,and size variables, and use the actors instead.
		this.x = x;
		this.y = y;
		this.gridX = (int) x;
		this.gridY = (int) y;
		initializeVectors();
		this.adjTiles = new Tile[6];
		this.riverSides = new RiverPart[6];
		this.units = new ArrayList<>();
		this.tileObservers = new ArrayList<>();
		this.serverObservers = new ArrayList<>();
		this.appliedImprovementTurns = 0;

		this.observerLabel = new CustomLabel("1,1");
		observerLabel.setSize(width, 20);
		observerLabel.setPosition(vectors[0].x - width / 2, vectors[0].y + 5);
	}

	@Override
	public void act(float delta) {
		super.act(delta);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {

		if (discovered || !Civilization.SHOW_FOG)
			for (TileTypeWrapper sprite : tileWrappers) {
				sprite.draw(batch);
			}

		if (!discovered && Civilization.SHOW_FOG) {
			fogSprite.draw(batch);
		}

		if (tileObservers.size() < 1 && Civilization.SHOW_FOG) {
			nonVisibleSprite.draw(batch);
		}

		if (drawSelection) {
			selectionSprite.draw(batch);
		}

		if (territory != null && (tileObservers.size() > 0 || !Civilization.SHOW_FOG) && !rangedTarget)
			territorySprite.draw(batch);

		if (rangedTarget) {
			rangedTargetSprite.draw(batch);
		}

		// FIXME: This is debug code. Make this prettier.
		if (serverObservers.size() < 1)
			return;

		observerLabel.setText("");
		int index = 0;
		for (TileObserver observer : serverObservers) {
			if (observer == null)
				continue;
			observerLabel.setText(observerLabel.getText() + (index > 0 ? "," : "") + observer.getID());
			index++;
		}

		observerLabel.draw(batch, 1);

	}

	@Override
	public float getWidth() {
		return width;
	}

	@Override
	public float getHeight() {
		return height;
	}

	@Override
	public float getX() {
		return x;
	}

	@Override
	public float getY() {
		return y;
	}

	@Override
	public String toString() {
		return getBaseTileType() + " [" + gridX + "," + gridY + "]";
	}

	public void addRiver(RiverPart river, int side) {
		// FIXME: The way our adjTiles are set up, all our possible river sides are:
		// 5,0,1,2. In the future, we want our adjTiles index to align /w the river.
		// So the possible river sides = 0,1,2,3
		riverSides[side] = river;
	}

	/**
	 * Returns the top tiletype
	 * 
	 * @return
	 */
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

	public RiverPart[] getRiverSides() {
		return riverSides;
	}

	public GameMap getMap() {
		return map;
	}

	public void onMouseHover() {
		drawSelection = true;

		((InGameScreen) Civilization.getInstance().getCurrentScreen()).getGameOverlay().setHoveredTile(this);
	}

	public void onMouseUnhover() {
		drawSelection = false;
	}

	public void setTileType(TileType tileType) {
		if (tileType == null)
			return;

		if (tileType == TileType.ROAD) {
			setRoad();
			return;
		}

		if (containsTileLayer(tileType.getTileLayer())) {

			tileWrappers.removeIf(tileWrapper -> tileWrapper.getTileType().getTileLayer() == tileType.getTileLayer());
		}
		// Add the tileType to the Array in an ordered manner. note: this will never be
		// a baseTile
		tileWrappers.add(new TileTypeWrapper(tileType, x, y, 28, 32));
	}

	public void removeTileType(TileType tileType) {

		if (tileType == null)
			return;

		// FIXME: Check to see if this is still concurrent modification
		// Happens when there is a ruin tile on a sheep & forest tile.
		tileWrappers.removeIf(tileWrapper -> tileWrapper.getTileType() == tileType);
	}

	public void addUnit(Unit unit) {
		if (unit.canAttack())
			units.add(0, unit);
		else
			units.add(unit);

		// FIXME: Make all this server side
		if (!unit.getPlayerOwner().equals(Civilization.getInstance().getGame().getPlayer()))
			return;

		addTileObserver(unit);
	}

	public void setEdge(int index, Tile tile) {
		adjTiles[index] = tile;
	}

	public void removeUnit(Unit unit) {
		units.remove(unit);

		// FIXME: Make all this server side
		if (!unit.getPlayerOwner().equals(Civilization.getInstance().getGame().getPlayer()))
			return;

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

	public int getGridX() {
		return this.gridX;
	}

	public int getGridY() {
		return this.gridY;
	}

	public Vector2[] getVectors() {
		return vectors;
	}

	public Tile[] getAdjTiles() {
		return adjTiles;
	}

	public int[][] getTrueAdjList() {
		// TODO Auto-generated method stub
		return null;
	}

	public ArrayList<TileObserver> getTileObservers() {
		return tileObservers;
	}

	public void setCity(City city) {
		this.city = city;
		setTileType(TileType.CITY);

		if (city.getPlayerOwner().equals(Civilization.getInstance().getGame().getPlayer()))
			addTileObserver(city);
	}

	public void setTerritory(City city) {
		this.territory = city;
		Color color = city.getPlayerOwner().getCivilization().getColor();
		territorySprite.setColor(color.r, color.g, color.b, 0.25f);

		if (city.getPlayerOwner().equals(Civilization.getInstance().getGame().getPlayer()))
			addTileObserver(city);
	}

	public void defineBorders() {
		int index = 0;
		for (Tile adjTile : getAdjTiles()) {
			if (adjTile == null)
				continue;
			if (adjTile.getTerritory() == null || !adjTile.getTerritory().equals(territory)) {
				// Draw a line at the index here.
				territoryBorders[index] = true;
			}
			index++;
		}
	}

	public void clearBorders() {
		for (int i = 0; i < territoryBorders.length; i++)
			territoryBorders[i] = false;
	}

	public Unit getUnitFromID(int unitID) {
		for (Unit unit : units)
			if (unit.getID() == unitID)
				return unit;

		return null;
	}

	// Return the next unit from the already selectedOne
	public Unit getNextUnit() {
		for (int i = 0; i < units.size(); i++) {
			Unit unit = units.get(i);
			if (unit.isSelected() && (i + 1) < units.size())
				return units.get(i + 1);
		}
		return units.get(0);
	}

	public boolean containsTileLayer(TileLayer tileLayer) {
		for (TileTypeWrapper tileWrapper : tileWrappers) {
			if (tileWrapper.getTileType().getTileLayer() == tileLayer)
				return true;
		}

		return false;
	}

	public boolean containsTileProperty(TileProperty... tileProperties) {
		for (TileTypeWrapper tileWrapper : tileWrappers) {
			for (TileProperty tileProperty : tileProperties)
				if (tileWrapper.getTileType().hasProperty(tileProperty))
					return true;
		}

		return false;
	}

	public boolean containsTileType(TileType... tileTypes) {
		for (TileType tileType : tileTypes)
			for (TileTypeWrapper tileWrapper : tileWrappers)
				if (tileWrapper.getTileType() == tileType)
					return true;

		return false;
	}

	public float getMovementCost(Tile prevTile) {

		float movementCost = 0;
		// Check if the tile were moving to
		int currentSideCheck = -1;
		for (int i = 0; i < adjTiles.length; i++) {
			if (prevTile.equals(adjTiles[i])) {
				currentSideCheck = i;
			}
		}

		if (riverSides[currentSideCheck] != null) {
			movementCost = 2;
		}

		// Check if the tile were moving from has a river
		int prevSideCheck = -1;
		for (int i = 0; i < prevTile.adjTiles.length; i++) {
			if (this.equals(prevTile.adjTiles[i])) {
				prevSideCheck = i;
			}
		}

		if (prevTile.getRiverSides()[prevSideCheck] != null) {
			movementCost = 2;
		}

		// TODO: Later on in the tech tree roads should go across rivers (bridges!)
		if (containsTileType(TileType.ROAD))
			return 0.5F;

		TileTypeWrapper topWrapper = ((TileTypeWrapper) tileWrappers.toArray()[tileWrappers.size() - 1]);
		if (topWrapper.getTileType().hasProperty(TileProperty.RESOURCE, TileProperty.IMPROVEMENT)) {
			float tileMovementCost = ((TileTypeWrapper) tileWrappers.toArray()[0]).getTileType().getMovementCost();
			if (tileMovementCost > movementCost) {
				movementCost = tileMovementCost;
			}

		} else if (topWrapper.getTileType().getMovementCost() > movementCost)
			movementCost = topWrapper.getTileType().getMovementCost();

		return movementCost;
	}

	public City getTerritory() {
		return territory;
	}

	public TreeSet<TileTypeWrapper> getTileTypeWrappers() {
		return tileWrappers;
	}

	public boolean isDiscovered() {
		return discovered;
	}

	public Unit getTopUnit() {
		Unit topUnit = null; // Top non support unit
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
			if (unit.getPlayerOwner().equals(player))
				continue;
			if (topUnit == null || (topUnit.getUnitTypes().contains(UnitType.SUPPORT)
					&& !unit.getUnitTypes().contains(UnitType.SUPPORT)))
				topUnit = unit;
		}

		return topUnit;
	}

	public City getCity() {
		return city;
	}

	public boolean isImproved() {
		return improved;
	}

	public AttackableEntity getEnemyAttackableEntity(AbstractPlayer player) {

		// Problem: This can AND WILL pick up friendly units. Fixed by having to return
		// enemy cities first.
		if (city != null && !city.getPlayerOwner().equals(player)) {
			return city;
		}

		return getTopEnemyUnit(player);
	}

	public AttackableEntity getAttackableEntity() {
		if (city != null) {
			return city;
		}
		return getTopUnit();
	}

	public void removeTileObserver(TileObserver tileObserver) {
		// Update visibility

		ArrayList<Tile> adjTiles = new ArrayList<>();
		adjTiles.add(this);
		adjTiles.addAll(Arrays.asList(getAdjTiles()));

		for (Tile tile : adjTiles) {
			if (tile == null) {
				continue;
			}
			tile.getTileObservers().remove(tileObserver);
			for (Tile adjTile : tile.getAdjTiles()) {
				if (adjTile == null)
					continue;
				adjTile.getTileObservers().remove(tileObserver);
			}

		}
	}

	public void setAppliedTurns(int appliedTurns) {
		this.appliedImprovementTurns = appliedTurns;
	}

	public int getAppliedImprovementTurns() {
		return appliedImprovementTurns;
	}

	public void addTileObserver(TileObserver tileObserver) {
		// Is hill
		boolean isHill = getBaseTileType() == TileType.GRASS_HILL || getBaseTileType() == TileType.DESERT_HILL
				|| getBaseTileType() == TileType.PLAINS_HILL;
		// Update visibility

		ArrayList<Tile> adjTiles = new ArrayList<>();
		adjTiles.add(this);
		Collections.addAll(adjTiles, getAdjTiles());
		for (Tile tile : adjTiles) {
			if (tile == null) {
				continue;
			}
			boolean denyVisibility = false;

			for (TileTypeWrapper wrapper : tile.getTileTypeWrappers())
				if (wrapper.getTileType().getMovementCost() > 1 && !tile.equals(this)
						&& !tileObserver.ignoresTileObstructions()) {
					denyVisibility = true;
				}

			tile.setDiscovered(true);

			if (!tile.getTileObservers().contains(tileObserver)) {
				tile.getTileObservers().add(tileObserver);
			}

			if (denyVisibility && !isHill) {
				continue;
			}

			for (Tile adjTile : tile.getAdjTiles()) {

				if (adjTile == null)
					continue;

				adjTile.setDiscovered(true);

				if (!adjTile.getTileObservers().contains(tileObserver)) {
					adjTile.getTileObservers().add(tileObserver);
				}
			}

		}
	}

	public void setImproved(boolean improved) {
		this.improved = improved;
	}

	private void setDiscovered(boolean discovered) {
		this.discovered = discovered;
	}

	public void setRangedTarget(boolean rangedTarget) {
		this.rangedTarget = rangedTarget;
	}

	public boolean hasRangedTarget() {
		return rangedTarget;
	}

	public boolean isAdjToRiver() {
		for (RiverPart part : riverSides) {
			if (part != null)
				return true;
		}

		return false;
	}

	public Road getRoad() {
		return road;
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

		for (Sprite sprite : tileWrappers) {
			sprite.setBounds(x, y, 28, 32);
		}

		selectionSprite.setSize(28, 32);
		selectionSprite.setPosition(x, y);

		territorySprite.setSize(28, 32);
		territorySprite.setPosition(x, y);

		fogSprite.setSize(28, 32);
		fogSprite.setPosition(x, y);

		nonVisibleSprite.setSize(28, 32);
		nonVisibleSprite.setPosition(x, y);

		rangedTargetSprite.setSize(28, 32);
		rangedTargetSprite.setPosition(x, y);
	}

	private void setRoad() {
		this.road = new Road(this);
		applyRoad();
	}

	public void applyRoad() {

		// Remove the previous road wrapper
		Iterator<TileTypeWrapper> iterator = tileWrappers.iterator();

		while (iterator.hasNext()) {
			TileTypeWrapper wrapper = iterator.next();
			if (wrapper.getTileType() == TileType.ROAD)
				iterator.remove();
		}

		TileTypeWrapper roadWrapper = new TileTypeWrapper(x, y, 28, 32);
		TextureEnum roadEnum = road.getRoadPart().getTexture();

		roadWrapper.setTileType(TileType.ROAD);
		roadWrapper.setSprite(roadEnum);
		tileWrappers.add(roadWrapper);
	}

	public ArrayList<TileObserver> getServerObservers() {
		return serverObservers;
	}

	public boolean[] getTerritoryBorders() {
		return territoryBorders;
	}
}
