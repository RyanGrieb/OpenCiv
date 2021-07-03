package me.rhin.openciv.game.unit;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.AbstractAction;
import me.rhin.openciv.game.map.GameMap;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileObserver;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.listener.BottomShapeRenderListener;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.ui.window.type.UnitCombatWindow;
import me.rhin.openciv.ui.window.type.UnitWindow;

public abstract class Unit extends Actor
		implements AttackableEntity, TileObserver, BottomShapeRenderListener, NextTurnListener {

	protected boolean canAttack;
	protected ArrayList<AbstractAction> customActions;
	protected Tile standingTile;
	protected Sprite targetSelectionSprite;
	private int id;
	private Player playerOwner;
	private ArrayList<Vector2[]> pathVectors;
	private int pathMovement;
	private Tile targetTile;
	private Sprite sprite, selectionSprite;
	private Sprite civIconSprite;
	private boolean selected;
	private float movement;
	private float health;
	private AttackableEntity targetEntity;

	public Unit(int id, String unitName, Player playerOwner, Tile standingTile, TextureEnum assetEnum) {
		Civilization.getInstance().getEventManager().addListener(BottomShapeRenderListener.class, this);

		this.id = id;
		setName(unitName);
		this.playerOwner = playerOwner;
		this.customActions = new ArrayList<>();
		this.pathVectors = new ArrayList<>();
		this.standingTile = standingTile;
		this.sprite = assetEnum.sprite();
		this.selectionSprite = TextureEnum.UI_SELECTION.sprite();
		// TODO: Change this sprite to a different texture
		this.targetSelectionSprite = TextureEnum.UI_SELECTION.sprite();
		this.civIconSprite = playerOwner.getCivType().getIcon().sprite();
		civIconSprite.setSize(8, 8);
		civIconSprite.setAlpha(0.8F);

		setPosition(standingTile.getVectors()[0].x - standingTile.getWidth() / 2, standingTile.getVectors()[0].y + 4);
		setSize(standingTile.getWidth(), standingTile.getHeight());

		this.movement = getMaxMovement();
		this.health = getMaxHealth();

		playerOwner.addUnit(this);

		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	public Unit(UnitParameter unitParameter, TextureEnum assetEnum) {
		this(unitParameter.getID(), unitParameter.getUnitName(), unitParameter.getPlayerOwner(),
				unitParameter.getStandingTile(), assetEnum);
	}

	public abstract int getMovementCost(Tile prevTile, Tile adjTile);

	@Override
	public void act(float delta) {
		super.act(delta);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		if (selected)
			selectionSprite.draw(batch);

		if ((targetTile != null && pathMovement <= getCurrentMovement() && pathMovement != 0) || hasRangedTarget()) {
			targetSelectionSprite.draw(batch);
		}

		if (standingTile.getTileObservers().size() > 0) {
			sprite.draw(batch);
			civIconSprite.draw(batch);
		}
	}

	@Override
	public void onNextTurn(NextTurnPacket packet) {
		this.movement = getMaxMovement();
	}

	@Override
	public float getMaxHealth() {
		return 100;
	}

	@Override
	public void flashColor(Color red) {
		sprite.setColor(red.r / 2, red.g / 2, red.b / 2, 1);

		final ScheduledThreadPoolExecutor executor = new ScheduledThreadPoolExecutor(2);
		executor.schedule(new Runnable() {
			@Override
			public void run() {
				sprite.setColor(Color.WHITE);
			}
		}, 250, TimeUnit.MILLISECONDS);

	}

	public boolean setTargetTile(Tile targetTile, boolean wasMouseClick) {
		if (targetTile == null)
			return false;

		if (targetTile.equals(this.targetTile))
			return false;

		pathVectors.clear();

		targetSelectionSprite.setPosition(targetTile.getVectors()[0].x - targetTile.getWidth() / 2,
				targetTile.getVectors()[0].y + 4);
		targetSelectionSprite.setSize(targetTile.getWidth(), targetTile.getHeight());

		// Find the shortest path to the target tile.
		// Remember:
		/*
		 * EDGES are lines pointing to another node. (Stores the others nodes location
		 * or instance).
		 * 
		 * NODES or VERTICES are the nodes (in this case our hexes) on the map!.
		 */

		// https://en.wikipedia.org/wiki/A*_search_algorithm
		// https://www.youtube.com/watch?v=6TsL96NAZCo

		// Remember, stack is LIFO.

		// int aScore = costOfPath + hurestic of the target point.

		// Tile should store is hurestic, tileNode should store is aScore.

		// FIXME: This shouldn't be a static number. (E.g. account for hills, ect.)
		// SHOULD NEVERRRR OVERESTIMATE tough
		int h = 0; // Lowest possible cost to reach nearest tile. (Do we want to
					// overestimate
		// this?).
		ArrayList<Tile> openSet = new ArrayList<>();
		Tile[][] cameFrom = new Tile[GameMap.WIDTH][GameMap.HEIGHT];
		int[][] gScores = new int[GameMap.WIDTH][GameMap.HEIGHT];
		int[][] fScores = new int[GameMap.WIDTH][GameMap.HEIGHT];

		for (int[] gScore : gScores)
			Arrays.fill(gScore, GameMap.MAX_NODES);
		for (int[] fScore : fScores)
			Arrays.fill(fScore, GameMap.MAX_NODES);

		gScores[standingTile.getGridX()][standingTile.getGridY()] = 0;
		fScores[standingTile.getGridX()][standingTile.getGridY()] = h;
		openSet.add(standingTile); // h or 0 ???

		while (openSet.size() > 0) {

			// Get the current tileNode /w the lowest fScore[] value.
			// FIXME: This can be O(1) /w a proper priority queue.
			Tile current = removeSmallest(openSet, fScores);

			if (current.equals(targetTile))
				break;

			openSet.remove(current);
			for (Tile adjTile : current.getAdjTiles()) {
				if (adjTile == null)
					continue;

				int tenativeGScore = gScores[current.getGridX()][current.getGridY()]
						+ getMovementCost(current, adjTile);

				if (tenativeGScore < gScores[adjTile.getGridX()][adjTile.getGridY()]) {

					cameFrom[adjTile.getGridX()][adjTile.getGridY()] = current;
					gScores[adjTile.getGridX()][adjTile.getGridY()] = tenativeGScore;

					int adjFScore = gScores[adjTile.getGridX()][adjTile.getGridY()] + h;
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
			pathMovement = 0;
			this.targetTile = null;
			Civilization.getInstance().getWindowManager().closeWindow(UnitCombatWindow.class);
			return false;
		}

		int iterations = 0;
		int pathMovement = 0;
		while (parentTile != null) {
			Tile nextTile = cameFrom[parentTile.getGridX()][parentTile.getGridY()];

			if (nextTile != null) {
				Vector2[] tileVectors = new Vector2[2];
				tileVectors[0] = new Vector2(parentTile.getX() + parentTile.getWidth() / 2,
						parentTile.getY() + parentTile.getHeight() / 2 + 4);
				tileVectors[1] = new Vector2(nextTile.getX() + nextTile.getWidth() / 2,
						nextTile.getY() + nextTile.getHeight() / 2 + 4);
				pathVectors.add(tileVectors);
			}

			if (nextTile == null)
				nextTile = targetTile;

			if (!parentTile.equals(standingTile)) {
				pathMovement += getMovementCost(nextTile, parentTile);
			}

			if (parentTile.equals(targetTile)) {
				break;
			}

			if (iterations >= GameMap.MAX_NODES) {
				Gdx.app.log(Civilization.LOG_TAG, "ERROR: Pathing iteration error");
				break;
			}

			parentTile = nextTile;
			iterations++;
		}

		this.targetTile = targetTile;
		this.pathMovement = pathMovement;

		// TODO: How would we implement cities able to be attacked?

		targetEntity = null;
		if (targetTile.getTopUnit() != null && !targetTile.getTopUnit().getPlayerOwner().equals(playerOwner))
			targetEntity = targetTile.getTopUnit();
		if (targetTile.getCity() != null && !targetTile.getCity().getPlayerOwner().equals(playerOwner)) {
			targetEntity = targetTile.getCity();
		}

		// Open combat preview window once.
		if (targetEntity != null && !isUnitCapturable() && wasMouseClick && !isRangedUnit()) {
			// Close previous combat windows.
			Civilization.getInstance().getWindowManager().closeWindow(UnitCombatWindow.class);
			Civilization.getInstance().getWindowManager().addWindow(new UnitCombatWindow(this, targetEntity));
		} else {
			Civilization.getInstance().getWindowManager().closeWindow(UnitCombatWindow.class);
		}

		if (targetEntity != null) {

			// FIXME: Range units should be able to move onto capturable units.
			if (isUnitCapturable() || isRangedUnit()) {
				pathVectors.clear();
				pathMovement = 0;
				this.targetTile = null;
			} else
				targetSelectionSprite.setColor(Color.RED);
		} else
			targetSelectionSprite.setColor(Color.YELLOW);

		return true;
	}

	@Override
	public void onBottomShapeRender(ShapeRenderer shapeRenderer) {
		// FIXME: We get a concurrency error here at some point
		if (targetEntity != null)
			shapeRenderer.setColor(Color.RED);
		else
			shapeRenderer.setColor(Color.YELLOW);
		for (Vector2[] vectors : pathVectors) {
			// System.out.println(maxMovement + "," + pathMovement);
			if (getCurrentMovement() < pathMovement)
				break;
			shapeRenderer.line(vectors[0], vectors[1]);

		}
	}

	@Override
	public boolean isUnitCapturable() {
		return false;
	}

	// FIXME: Have this method replace getStandingTile()
	@Override
	public Tile getTile() {
		return standingTile;
	}

	public void moveToTargetTile() {
		if (targetTile == null)
			return;

		pathVectors.clear();

		standingTile.removeUnit(this);
		targetTile.addUnit(this);

		setPosition(targetTile.getVectors()[0].x - targetTile.getWidth() / 2, targetTile.getVectors()[0].y + 4);
		standingTile = targetTile;

		targetTile = null;
	}

	public void sendMovementPacket() {
		if (targetTile == null)
			return;

		MoveUnitPacket packet = new MoveUnitPacket();
		packet.setUnit(playerOwner.getName(), id, standingTile.getGridX(), standingTile.getGridY(),
				targetTile.getGridX(), targetTile.getGridY());
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

	public void setPosition(float x, float y) {
		sprite.setPosition(x, y);
		selectionSprite.setPosition(x, y);
		civIconSprite.setPosition(x + 10, y + 20);
		super.setPosition(x, y);
	}

	public void setSize(float width, float height) {
		sprite.setSize(width, height);
		selectionSprite.setSize(width, height);
	}

	public void setSelected(final boolean selected) {
		this.selected = selected;

		// Sometimes, due to lag the unit is unselected before it moves, we remove the
		// path vectors to account for that
		final Unit thisUnit = this;
		Gdx.app.postRunnable(new Runnable() {
			public void run() {
				if (!selected) {
					pathVectors.clear();
					targetTile = null;
					Civilization.getInstance().getWindowManager().closeWindow(UnitWindow.class);
					Civilization.getInstance().getWindowManager().closeWindow(UnitCombatWindow.class);
				} else {
					Civilization.getInstance().getWindowManager().addWindow(new UnitWindow(thisUnit));
				}
			}
		});

	}

	public void setPlayerOwner(Player playerOwner) {
		this.playerOwner = playerOwner;
		this.civIconSprite = playerOwner.getCivType().getIcon().sprite();
		civIconSprite.setBounds(getX() + 10, getY() + 20, 8, 8);

		if (!playerOwner.equals(Civilization.getInstance().getGame().getPlayer()))
			standingTile.removeTileObserver(this);
		else
			standingTile.addTileObserver(this);
	}

	public void reduceMovement(int movementCost) {
		movement -= movementCost;

		if (movement < 0)
			movement = 0;
	}

	public float getCurrentMovement() {
		return movement;
	}

	public int getMaxMovement() {
		return 2;
	}

	public int getPathMovement() {
		return pathMovement;
	}

	public Sprite getSprite() {
		return sprite;
	}

	public boolean isSelected() {
		return selected;
	}

	public Tile getTargetTile() {
		return targetTile;
	}

	public Player getPlayerOwner() {
		return playerOwner;
	}

	public ArrayList<AbstractAction> getCustomActions() {
		return customActions;
	}

	public Tile getStandingTile() {
		return standingTile;
	}

	public int getID() {
		return id;
	}

	public boolean canAttack() {
		return canAttack;
	}

	public float getHealth() {
		return health;
	}

	public void setHealth(float health) {

		if (health <= 0)
			health = 1;

		this.health = health;
	}

	public boolean isRangedUnit() {
		return this instanceof RangedUnit;
	}

	public boolean hasRangedTarget() {
		return false;
	}

	private Tile removeSmallest(ArrayList<Tile> queue, int fScore[][]) {
		int smallest = Integer.MAX_VALUE;
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
