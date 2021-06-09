package me.rhin.openciv.game.map.tile;

import java.util.ArrayList;
import java.util.TreeSet;

import com.badlogic.gdx.Gdx;
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
import me.rhin.openciv.game.map.tile.TileType.TileLayer;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.listener.ShapeRenderListener;
import me.rhin.openciv.ui.label.CustomLabel;

public class Tile extends Actor implements ShapeRenderListener {

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

		@Override
		public int compareTo(TileTypeWrapper tileTypeWrapper) {
			return tileType.getTileLayer().ordinal() - tileTypeWrapper.getTileType().getTileLayer().ordinal();
		}

		public TileType getTileType() {
			return tileType;
		}
	}

	private static final int SIZE = 16;
	private static final int SPRITE_WIDTH = 28;
	private static final int SPRITE_HEIGHT = 32;

	private GameMap map;
	private TreeSet<TileTypeWrapper> tileWrappers;
	private Sprite selectionSprite;
	private Sprite territorySprite;
	private boolean[] territoryBorders;
	private boolean drawSelection;
	private CustomLabel posLabel;
	private float x, y, width, height;
	private int gridX, gridY;
	private Vector2[] vectors;
	private Tile[] adjTiles;
	private RiverPart[] riverSides;
	private City city;
	private City territory;
	private ArrayList<Unit> units;

	public Tile(GameMap map, TileType tileType, float x, float y) {
		Civilization.getInstance().getEventManager().addListener(ShapeRenderListener.class, this);
		this.map = map;
		if (tileType.getTileLayer() != TileLayer.BASE) {
			Gdx.app.log(Civilization.LOG_TAG,
					"WARNING: TileType " + tileType.name() + " top layer applied to constructor");
		}
		this.tileWrappers = new TreeSet<>();
		tileWrappers.add(new TileTypeWrapper(tileType));

		this.selectionSprite = new Sprite(TextureEnum.TILE_SELECT.sprite());
		selectionSprite.setAlpha(0.2f);
		this.territorySprite = new Sprite(TextureEnum.TILE_SELECT.sprite());
		this.territoryBorders = new boolean[6];
		this.drawSelection = false;
		// FIXME: Remove our own x,y,and size variables, and use the actors instead.
		this.x = x;
		this.y = y;
		this.gridX = (int) x;
		this.gridY = (int) y;
		initializeVectors();
		this.adjTiles = new Tile[6];
		this.riverSides = new RiverPart[6];
		this.units = new ArrayList<>();

		this.posLabel = new CustomLabel(gridX + "," + gridY);
		posLabel.setSize(width, 20);
		posLabel.setPosition(vectors[0].x - width / 2, vectors[0].y + 5);
	}

	@Override
	public void onShapeRender(ShapeRenderer shapeRenderer) {

		// Draw the hexagon outline

		// FIXME: Don't render lines if they're off the screen. This isn't part of the
		// actor class so we need to manually put that in.

		for (int i = 0; i < territoryBorders.length; i++) {
			boolean renderLine = territoryBorders[i];
			if (!renderLine)
				continue;

			// 0 = 5 0
			// 1 = 0 1
			// 2 = 1 2
			int v1 = i - 1;
			int v2 = i;
			if (v1 == -1) {
				v1 = 5;
				v2 = 0;
			}

			shapeRenderer.setColor(territory.getPlayerOwner().getCivType().getColor());
			shapeRenderer.line(vectors[v1], vectors[v2]);
		}

		shapeRenderer.setColor(0, 0, 0, 0.3F);
		for (int i = 0; i < adjTiles.length; i++) {
			Tile adjTile = adjTiles[i];

			int v1 = i - 1;
			int v2 = i;
			if (v1 == -1) {
				v1 = 5;
				v2 = 0;
			}

			if ((adjTile == null || adjTile.getTerritory() == null) && territory == null) {
				// shapeRenderer.line(vectors[v1], vectors[v2]);
			}
		}
	}

	@Override
	public void act(float delta) {
		super.act(delta);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {

		for (TileTypeWrapper sprite : tileWrappers) {
			sprite.draw(batch);
		}

		if (drawSelection) {
			selectionSprite.draw(batch);
		}

		if (territory != null)
			territorySprite.draw(batch);

		// posLabel.draw(batch, 1);
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

	public void addRiver(RiverPart river, int side) {
		// FIXME: The way our adjTiles are set up, all our possible river sides are:
		// 5,0,1,2. In the future, we want our adjTiles index to align /w the river.
		// So the possible river sides = 0,1,2,3
		riverSides[side] = river;
	}

	public RiverPart[] getRiverSides() {
		return riverSides;
	}

	public GameMap getMap() {
		return map;
	}

	public void onMouseHover() {
		drawSelection = true;
	}

	public void onMouseUnhover() {
		drawSelection = false;
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
		tileWrappers.add(new TileTypeWrapper(tileType, x, y, 28, 32));
	}

	public void addUnit(Unit unit) {
		if (unit.canAttack())
			units.add(0, unit);
		else
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
	}

	public void setCity(City city) {
		this.city = city;
		setTileType(TileType.CITY);
	}

	public void setTerritory(City city) {
		this.territory = city;
		Color color = city.getPlayerOwner().getCivType().getColor();
		territorySprite.setColor(color.r, color.g, color.b, 0.25f);
	}

	public void defineBorders() {
		int index = 0;
		for (Tile adjTile : getAdjTiles()) {
			if (adjTile.getTerritory() == null) {
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

	public int getMovementCost(Tile prevTile) {
		// Check if the tile were moving to
		int currentSideCheck = -1;
		for (int i = 0; i < adjTiles.length; i++) {
			if (prevTile.equals(adjTiles[i])) {
				currentSideCheck = i;
			}
		}

		if (riverSides[currentSideCheck] != null) {
			return 2;
		}

		// Check if the tile were moving from has a river
		int prevSideCheck = -1;
		for (int i = 0; i < prevTile.adjTiles.length; i++) {
			if (this.equals(prevTile.adjTiles[i])) {
				prevSideCheck = i;
			}
		}

		if (prevTile.getRiverSides()[prevSideCheck] != null) {
			return 2;
		}

		TileTypeWrapper topWrapper = ((TileTypeWrapper) tileWrappers.toArray()[tileWrappers.size() - 1]);
		if (topWrapper.getTileType().hasProperty(TileProperty.RESOURCE)) {

			return ((TileTypeWrapper) tileWrappers.toArray()[tileWrappers.size() - 2]).getTileType().getMovementCost();
		} else
			return topWrapper.getTileType().getMovementCost();
	}

	public City getTerritory() {
		return territory;
	}

	public TreeSet<TileTypeWrapper> getTileTypeWrappers() {
		return tileWrappers;
	}
}
