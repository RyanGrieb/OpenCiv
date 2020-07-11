package me.rhin.openciv.server.game.unit;

import java.util.ArrayList;
import java.util.Arrays;

import com.badlogic.gdx.math.Vector2;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.GameMap;
import me.rhin.openciv.server.game.map.tile.Tile;

public abstract class Unit {

	private static int unitID = 0;

	private int id;
	private ArrayList<Vector2[]> pathVectors = new ArrayList<>();
	private Player playerOwner;
	private float x, y;
	private float width, height;
	private Tile standingTile, targetTile;
	private boolean selected;
	private int maxMovement;
	private int pathMovement;
	private float currentMovementOffset;
	private long lastMoveTime;
	private float health;

	public Unit(Player playerOwner, Tile standingTile) {
		this.id = unitID++;
		this.playerOwner = playerOwner;
		this.standingTile = standingTile;
		setPosition(standingTile.getVectors()[0].x - standingTile.getWidth() / 2, standingTile.getVectors()[0].y + 4);
		setSize(standingTile.getWidth(), standingTile.getHeight());

		this.maxMovement = 3;
		playerOwner.addOwnedUnit(this);
	}

	public abstract int getMovementCost(Tile tile);

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

				int tenativeGScore = gScores[current.getGridX()][current.getGridY()] + getMovementCost(adjTile);

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
				pathMovement += parentTile.getTileType().getMovementCost();
			}

			if (parentTile.equals(targetTile)) {
				break;
			}

			if (iterations >= GameMap.MAX_NODES) {
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
		long currentTime = System.currentTimeMillis() / 1000;
		currentMovementOffset = getCurrentMovement();
		currentMovementOffset -= movementCost;
		lastMoveTime = currentTime;
	}

	public float getCurrentMovement() {
		// Return a movement value between 0 - 3.
		// NOTE: 1 movement = 3 seconds.
		long turnsPassed = ((System.currentTimeMillis() / 1000) - lastMoveTime)
				/ (Server.getInstance().getGame().getTurnTime() / this.maxMovement);
		if (currentMovementOffset + turnsPassed > maxMovement)
			return maxMovement;

		return currentMovementOffset + turnsPassed;
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

	public boolean isSelected() {
		return selected;
	}

	public Tile getTargetTile() {
		return targetTile;
	}

	public int getMaxMovement() {
		return maxMovement;
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
}
