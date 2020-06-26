package me.rhin.openciv.game.map.tile;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.CityTerritory;
import me.rhin.openciv.game.map.GameMap;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.listener.ShapeRenderListener;
import me.rhin.openciv.ui.label.CustomLabel;

// We can extend the actor class for other sprites (e.g. terrain) here, but when we draw lines we need to use the RendererListener.
public class Tile extends Actor implements ShapeRenderListener {

	private static final int SIZE = 16;
	private static final int SPRITE_WIDTH = 28;
	private static final int SPRITE_HEIGHT = 32;

	private GameMap map;
	private TileType tileType;
	private Sprite sprite;
	public Sprite topSprite;
	private Sprite selectionSprite;
	private boolean drawSelection;
	private CustomLabel posLabel;
	private float x, y, width, height;
	private int gridX, gridY;
	private Vector2[] vectors;
	private Tile[] adjTiles;
	private City city;
	private CityTerritory cityTerritory;
	private ArrayList<Unit> units;

	public Tile(GameMap map, TileType tileType, float x, float y) {
		Civilization.getInstance().getEventManager().addListener(ShapeRenderListener.class, this);
		this.map = map;
		this.tileType = tileType;
		this.sprite = tileType.sprite();
		this.selectionSprite = new Sprite(TextureEnum.TILE_SELECT.sprite());
		selectionSprite.setAlpha(0.2f);

		this.drawSelection = false;
		// FIXME: Remove our own x,y,and size variables, and use the actors instead.
		this.x = x;
		this.y = y;
		this.gridX = (int) x;
		this.gridY = (int) y;
		initializeVectors();
		this.adjTiles = new Tile[6];
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

		// shapeRenderer.setColor(0F, 0F, 0F, 0.3F);
		// shapeRenderer.line(vectors[0], vectors[1]);
		// shapeRenderer.line(vectors[1], vectors[2]);
		// shapeRenderer.line(vectors[2], vectors[3]);
		// shapeRenderer.line(vectors[3], vectors[4]);
		// shapeRenderer.line(vectors[4], vectors[5]);
		// shapeRenderer.line(vectors[5], vectors[0]);
	}

	@Override
	public void act(float delta) {
		super.act(delta);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		// FIXME: Instead of drawing all the individual sprites, have the game map
		// create a single mesh merging of our created sprites.
		// We did it before

		// FIXME: This is inefficient. Water tiles replaced as grass still get drawn
		// under the grass
		// Have mountians and trees have their own special labels for the bottom Sprite
		// to be rendered.
		// if (!sprite.getTexture().equals(bottomSprite.getTexture()))
		// if (!tileType.equals(TileType.OCEAN))
		// bottomSprite.draw(batch);

		sprite.draw(batch);

		if (topSprite != null)
			topSprite.draw(batch);

		if (drawSelection)
			selectionSprite.draw(batch);
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
		this.tileType = tileType;
		// Update the texture, this seems redundant???
		// if (tileType != this.tileType)
		// bottomSprite.setTexture(sprite.getTexture());
		// System.out.println(sprite.getTexture()+","+tileType.sprite().getTexture());
		float x = sprite.getX();
		float y = sprite.getY();
		this.sprite = tileType.sprite();
		sprite.setPosition(x, y);
		sprite.setSize(SPRITE_WIDTH, SPRITE_HEIGHT);
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

	public TileType getTileType() {
		return tileType;
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

		sprite.setSize(28, 32);
		sprite.setPosition(x, y);
		// bottomSprite.setSize(28, 32);
		// bottomSprite.setPosition(x, y);
		selectionSprite.setSize(28, 32);
		selectionSprite.setPosition(x, y);
	}

	public Sprite getSprite() {
		return sprite;

	}

	public void setTopSprite(Sprite topSprite) {
		this.topSprite = topSprite;
	}

	public void setCity(City city) {
		this.city = city;
		Sprite citySprite = TileType.CITY.sprite();
		citySprite.setSize(28, 32);
		citySprite.setPosition(x, y);
		setTopSprite(citySprite);
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
}
