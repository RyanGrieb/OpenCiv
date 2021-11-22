package me.rhin.openciv.game.unit;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.utils.Timer;
import com.badlogic.gdx.utils.Timer.Task;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.SoundEnum;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.GameMap;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileObserver;
import me.rhin.openciv.game.notification.type.AvailableMovementNotification;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.game.unit.UnitItem.UnitType;
import me.rhin.openciv.game.unit.actions.AbstractAction;
import me.rhin.openciv.game.unit.actions.type.EmbarkAction;
import me.rhin.openciv.game.unit.actions.type.MoveAction;
import me.rhin.openciv.listener.BottomShapeRenderListener;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.ui.window.type.UnitCombatWindow;
import me.rhin.openciv.ui.window.type.UnitWindow;

public abstract class Unit extends Actor
		implements AttackableEntity, TileObserver, BottomShapeRenderListener, NextTurnListener {

	protected ArrayList<AbstractAction> customActions;
	protected Tile standingTile;
	protected Sprite targetSelectionSprite;
	private int id;
	private AbstractPlayer playerOwner;
	private ArrayList<Vector2[]> pathVectors;
	private ArrayList<Tile> movementTiles;
	private float pathMovement;
	private Tile targetTile;
	private Sprite sprite, selectionSprite;
	private Sprite civIconSprite;
	private boolean selected;
	protected float movement;
	private float health;
	private boolean ignoresTileObstructions;
	private AttackableEntity targetEntity;

	public Unit(int id, String unitName, AbstractPlayer playerOwner, Tile standingTile, TextureEnum assetEnum) {
		this.id = id;
		setName(unitName);
		this.playerOwner = playerOwner;
		this.customActions = new ArrayList<>();
		this.pathVectors = new ArrayList<>();
		this.movementTiles = new ArrayList<>();
		this.standingTile = standingTile;
		this.sprite = assetEnum.sprite();
		this.selectionSprite = TextureEnum.UI_SELECTION.sprite();
		// TODO: Change this sprite to a different texture
		this.targetSelectionSprite = TextureEnum.UI_SELECTION.sprite();
		this.civIconSprite = playerOwner.getCivilization().getIcon().sprite();
		civIconSprite.setSize(8, 8);
		civIconSprite.setAlpha(0.8F);

		setPosition(standingTile.getVectors()[0].x - standingTile.getWidth() / 2, standingTile.getVectors()[0].y + 4);
		setSize(standingTile.getWidth(), standingTile.getHeight());

		this.movement = getMaxMovement();
		this.health = getMaxHealth();

		playerOwner.addUnit(this);

		customActions.add(new MoveAction(this));
		customActions.add(new EmbarkAction(this));

		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(BottomShapeRenderListener.class, this);
	}

	public Unit(UnitParameter unitParameter, TextureEnum assetEnum) {
		this(unitParameter.getID(), unitParameter.getUnitName(), unitParameter.getPlayerOwner(),
				unitParameter.getStandingTile(), assetEnum);
	}

	public abstract float getMovementCost(Tile prevTile, Tile adjTile);

	public abstract List<UnitType> getUnitTypes();

	@Override
	public void act(float delta) {
		super.act(delta);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {

		if (playerOwner instanceof Player) {
			if (selected)
				selectionSprite.draw(batch);

			if ((targetTile != null && pathMovement <= getCurrentMovement() && pathMovement > 0) || hasRangedTarget()) {
				targetSelectionSprite.draw(batch);
			}
		}

		if (standingTile.getTileObservers().size() > 0 || !Civilization.SHOW_FOG) {
			sprite.draw(batch);
			civIconSprite.draw(batch);
		}

		// Move sprite to our standing tile

		// FIXME: We animate attacks to enemies wrong

		// Increment the sprite to the target tile
		if (movementTiles.size() > 0 && targetTile == null) {
			Tile tile = movementTiles.get(0);

			float tileX = tile.getVectors()[0].x - tile.getWidth() / 2;
			float tileY = tile.getVectors()[0].y + 4;

			float deltaX = tileX - sprite.getX();
			float deltaY = tileY - sprite.getY();

			float angle = (float) Math.atan2(deltaY, deltaX);

			float speed = 2;

			float xIncrement = (float) (speed * Math.cos(angle));
			float yIncrement = (float) (speed * Math.sin(angle));

			sprite.setPosition(sprite.getX() + xIncrement, sprite.getY() + yIncrement);

			if (Math.abs(sprite.getX() - tileX) < 1 && Math.abs(sprite.getY() - tileY) < 1) {
				movementTiles.remove(tile);
			}
		}
	}

	@Override
	public void onNextTurn(NextTurnPacket packet) {
		this.movement = getMaxMovement();

		if (Civilization.getInstance().getGame().getPlayer().equals(playerOwner) && allowsMovement())
			Civilization.getInstance().getGame().getNotificationHanlder()
					.fireNotification(new AvailableMovementNotification(this));
	}

	@Override
	public float getMaxHealth() {
		return 100;
	}

	@Override
	public void flashColor(Color color) {
		sprite.setColor(color.r / 2, color.g / 2, color.b / 2, 1);

		float delay = 0.25F; // seconds

		Timer.schedule(new Task() {
			@Override
			public void run() {
				sprite.setColor(Color.WHITE);
			}
		}, delay);
	}

	// TODO: Have force set target tile still init values like setTargetTile()
	public void forceSetTargetTile(Tile targetTile) {
		this.targetTile = targetTile;
	}

	public boolean setTargetTile(Tile targetTile, boolean wasMouseClick) {

		if (targetTile == null)
			return false;

		if (targetTile.equals(this.targetTile))
			return false;

		pathVectors.clear();
		clearMovementTiles();

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
		float[][] gScores = new float[GameMap.WIDTH][GameMap.HEIGHT];
		float[][] fScores = new float[GameMap.WIDTH][GameMap.HEIGHT];

		for (float[] gScore : gScores)
			Arrays.fill(gScore, GameMap.MAX_NODES);
		for (float[] fScore : fScores)
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

				float tenativeGScore = gScores[current.getGridX()][current.getGridY()]
						+ getMovementCost(current, adjTile);

				// If the tile has a non-friendly unit. Don't allow to pass through
				if (current.getEnemyAttackableEntity(playerOwner) != null) {
					tenativeGScore += 100;
				}

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
			pathMovement = 0;
			this.targetTile = null;
			Civilization.getInstance().getWindowManager().closeWindow(UnitCombatWindow.class);
			return false;
		}

		int iterations = 0;
		float pathMovement = 0;
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
			targetSelectionSprite.setColor(Color.ORANGE);

		return true;
	}

	@Override
	public void onBottomShapeRender(ShapeRenderer shapeRenderer) {

		if (!(playerOwner instanceof Player))
			return;

		// FIXME: We get a concurrency error here at some point
		if (targetEntity != null)
			shapeRenderer.setColor(Color.RED);
		else
			shapeRenderer.setColor(Color.ORANGE);
		for (Vector2[] vectors : new ArrayList<>(pathVectors)) {
			// System.out.println(maxMovement + "," + pathMovement);
			if (getCurrentMovement() < pathMovement || vectors == null)
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

	@Override
	public boolean ignoresTileObstructions() {
		return ignoresTileObstructions;
	}

	@Override
	public void setIgnoresTileObstructions(boolean ignoresTileObstructions) {
		this.ignoresTileObstructions = ignoresTileObstructions;

		standingTile.removeTileObserver(this);
		standingTile.addTileObserver(this);
	}

	public void moveToTargetTile() {
		if (targetTile == null)
			return;

		movementTiles = getMovementPath(targetTile);

		standingTile.removeUnit(this);
		targetTile.addUnit(this);

		// setPosition(targetTile.getVectors()[0].x - targetTile.getWidth() / 2,
		// targetTile.getVectors()[0].y + 4);

		float tileX = targetTile.getVectors()[0].x - targetTile.getWidth() / 2;
		float tileY = targetTile.getVectors()[0].y + 4;

		selectionSprite.setPosition(tileX, tileY);
		civIconSprite.setPosition(tileX + 10, tileY + 20);
		super.setPosition(tileX, tileY);

		standingTile = targetTile;

		targetTile = null;
		pathVectors.clear();
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

		if (selected) {
			Civilization.getInstance().getSoundHandler().playEffect(SoundEnum.UNIT_CLICK);
			// SoundEnum.playSound(SoundEnum.UNIT_CLICK);
		}
	}

	public void setPlayerOwner(AbstractPlayer playerOwner) {
		this.playerOwner = playerOwner;
		this.civIconSprite = playerOwner.getCivilization().getIcon().sprite();
		civIconSprite.setBounds(getX() + 10, getY() + 20, 8, 8);

		if (!playerOwner.equals(Civilization.getInstance().getGame().getPlayer()))
			standingTile.removeTileObserver(this);
		else
			standingTile.addTileObserver(this);
	}

	public void reduceMovement(float movementCost) {
		movement -= movementCost;

		if (movement < 0)
			movement = 0;
	}

	public void setMovement(int movement) {
		this.movement = movement;
	}

	public float getCurrentMovement() {
		return movement;
	}

	public float getMaxMovement() {
		return 2;
	}

	public float getPathMovement() {
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

	public AbstractPlayer getPlayerOwner() {
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
		return !getUnitTypes().contains(UnitType.SUPPORT);
	}

	@Override
	public float getHealth() {
		return health;
	}

	// TODO: Implement these
	@Override
	public void setMaxHealth(float health) {
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

	protected Tile removeSmallest(ArrayList<Tile> queue, float fScore[][]) {
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

	public boolean allowsMovement() {
		return true;
	}

	public void kill() {
		Civilization.getInstance().getEventManager().clearListenersFromObject(this);
	}

	private ArrayList<Tile> getMovementPath(Tile tile) {

		ArrayList<Tile> pathTiles = new ArrayList<>();

		int h = 0;
		ArrayList<Tile> openSet = new ArrayList<>();
		Tile[][] cameFrom = new Tile[GameMap.WIDTH][GameMap.HEIGHT];
		float[][] gScores = new float[GameMap.WIDTH][GameMap.HEIGHT];
		float[][] fScores = new float[GameMap.WIDTH][GameMap.HEIGHT];

		for (float[] gScore : gScores)
			Arrays.fill(gScore, GameMap.MAX_NODES);
		for (float[] fScore : fScores)
			Arrays.fill(fScore, GameMap.MAX_NODES);

		gScores[standingTile.getGridX()][standingTile.getGridY()] = 0;
		fScores[standingTile.getGridX()][standingTile.getGridY()] = h;
		openSet.add(standingTile);

		while (openSet.size() > 0) {

			Tile current = removeSmallest(openSet, fScores);

			if (current.equals(targetTile))
				break;

			openSet.remove(current);
			for (Tile adjTile : current.getAdjTiles()) {
				if (adjTile == null)
					continue;

				float tenativeGScore = gScores[current.getGridX()][current.getGridY()]
						+ getMovementCost(current, adjTile);

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
			targetTile = null;
		}

		// System.out.println("Target:" + targetTile);
		int iterations = 0;

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
			if (iterations >= GameMap.MAX_NODES) {
				targetTile = null;
				break;
			}
			pathTiles.add(nextTile);

			parentTile = nextTile;
		}

		Collections.reverse(pathTiles);
		return pathTiles;
	}

	private void clearMovementTiles() {
		movementTiles.clear();
		sprite.setPosition(getX(), getY());
	}
}
