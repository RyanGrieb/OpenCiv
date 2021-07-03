package me.rhin.openciv.server.game.unit;

import java.util.ArrayList;
import java.util.Arrays;

import com.badlogic.gdx.math.Vector2;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.listener.NextTurnListener;

public abstract class Unit implements AttackableEntity, NextTurnListener {

	private static int unitID = 0;

	private int id;
	private Tile[][] cameFrom;
	private ArrayList<Vector2[]> pathVectors = new ArrayList<>();
	private Player playerOwner;
	private float x, y;
	private float width, height;
	private Tile standingTile, targetTile;
	private boolean selected;
	private int pathMovement;
	private int movement;
	private float health;

	public Unit(Player playerOwner, Tile standingTile) {
		this.id = unitID++;
		this.playerOwner = playerOwner;
		this.standingTile = standingTile;
		this.movement = getMaxMovement();
		this.health = 100;
		setPosition(standingTile.getVectors()[0].x - standingTile.getWidth() / 2, standingTile.getVectors()[0].y + 4);
		setSize(standingTile.getWidth(), standingTile.getHeight());

		playerOwner.addOwnedUnit(this);

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {
		this.movement = getMaxMovement();
	}

	@Override
	public boolean isUnitCapturable() {
		return false;
	}

	// FIXME: Replace getStandingTile method
	@Override
	public Tile getTile() {
		return standingTile;
	}

	@Override
	public float getDamageTaken(AttackableEntity otherEntity) {
		if (isUnitCapturable())
			return 100;

		if (otherEntity.isUnitCapturable() || this instanceof RangedUnit)
			return 0;

		// y=30*1.041^(x), x= combat diff

		// FIXME: This code is not ideal, have separate mele & ranged classes for this
		float otherEntityCombatStrength = otherEntity.getCombatStrength();
		if (otherEntity instanceof RangedUnit)
			otherEntityCombatStrength = ((RangedUnit) otherEntity).getRangedCombatStrength();

		return (float) (30 * (Math.pow(1.041, otherEntityCombatStrength - getCombatStrength())));
	}

	@Override
	public boolean surviveAttack(AttackableEntity otherEntity) {
		return health - getDamageTaken(otherEntity) > 0;
	}

	@Override
	public void setHealth(float health) {
		this.health = health;
	}

	@Override
	public float getHealth() {
		return health;
	}

	public abstract int getMovementCost(Tile prevTile, Tile adjTile);

	public abstract int getCombatStrength();

	public boolean setTargetTile(Tile targetTile) {
		if (targetTile == null)
			return false;

		if (targetTile.equals(this.targetTile))
			return false;

		pathVectors.clear();

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

		int width = Server.getInstance().getMap().getWidth();
		int height = Server.getInstance().getMap().getHeight();
		int maxNodes = Server.getInstance().getMap().getMaxNodes();

		ArrayList<Tile> openSet = new ArrayList<>();
		cameFrom = new Tile[width][height];
		int[][] gScores = new int[width][height];
		int[][] fScores = new int[width][height];

		for (int[] gScore : gScores)
			Arrays.fill(gScore, maxNodes);
		for (int[] fScore : fScores)
			Arrays.fill(fScore, maxNodes);

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

			if (iterations >= maxNodes) {
				break;
			}

			parentTile = nextTile;
			iterations++;
		}

		this.targetTile = targetTile;
		this.pathMovement = pathMovement;

		return true;
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

	public void moveToTargetTile() {
		if (targetTile == null)
			return;

		pathVectors.clear();

		standingTile.removeUnit(this);
		targetTile.addUnit(this);

		setPosition(targetTile.getVectors()[0].x - targetTile.getWidth() / 2, targetTile.getVectors()[0].y + 4);
		standingTile = targetTile;

		// TODO: Determine if we still have no movement left.

		targetTile = null;
		selected = false;
	}

	public void reduceMovement(int movementCost) {
		movement -= movementCost;

		if (movement < 0)
			movement = 0;
	}

	public float getMovement() {
		return movement;
	}

	public void setPosition(float x, float y) {
		this.x = x;
		this.y = y;
	}

	public void setSize(float width, float height) {
		this.width = width;
		this.height = height;
	}

	public void setSelected(boolean selected) {
		this.selected = selected;
	}

	public int getMaxMovement() {
		return 2;
	}

	public boolean isSelected() {
		return selected;
	}

	public Tile getStandingTile() {
		return standingTile;
	}

	public Tile getTargetTile() {
		return targetTile;
	}

	public Player getPlayerOwner() {
		return playerOwner;
	}

	public ArrayList<Vector2[]> getPathVectors() {
		return pathVectors;
	}

	public int getPathMovement() {
		return pathMovement;
	}

	public int getID() {
		return id;
	}

	public void setPlayerOwner(Player playerOwner) {
		this.playerOwner = playerOwner;
	}

	public Tile[][] getCameFromTiles() {
		return cameFrom;
	}
}
