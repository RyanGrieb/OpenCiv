package me.rhin.openciv.server.game.ai.unit;

import java.util.ArrayList;
import java.util.Arrays;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.shared.listener.Listener;

public abstract class UnitAI {

	protected Unit unit;

	public UnitAI(Unit unit) {
		this.unit = unit;
	}

	public abstract void clearListeners();

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

	protected ArrayList<Tile> getPathTiles(Tile targetTile) {

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

		Tile standingTile = unit.getStandingTile();

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

				// FIXME: Make units & cities increase gScore.
				float tenativeGScore = gScores[current.getGridX()][current.getGridY()]
						+ unit.getMovementCost(current, adjTile);

				// Avoid walking into cities.
				if (current.getCity() != null && !current.getCity().getPlayerOwner().equals(unit.getPlayerOwner()))
					tenativeGScore += 10000;

				// Avoid friendly units
				if (current.getUnits().size() > 0 && current.getTopUnit().getPlayerOwner().equals(unit.getPlayerOwner())
						&& !current.getTopUnit().equals(unit)) {
					tenativeGScore += 10000;
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
			targetTile = null;
		}

		// System.out.println("Target:" + targetTile);
		int iterations = 0;
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
			if (iterations >= width * height) {
				targetTile = null;
				break;
			}
			pathTiles.add(nextTile);

			parentTile = nextTile;
		}

		return pathTiles;
	}

	/**
	 * Returns the farthest tile the unit can move to, based on the units movement.
	 * 
	 * @param pathTiles The path we want to take.
	 * @return Tile - The closest tile we can walk to currently.
	 */
	protected Tile stepTowardTarget(ArrayList<Tile> pathTiles) {

		// System.out.println("Path tiles");
		// for (Tile tile : pathTiles)
		// System.out.println(tile);

		if (pathTiles.size() < 1)
			return null;

		Tile pathingTile = null;
		Tile targetTile = pathTiles.get(0);
		int index = 0;
		float movementCost = 0;
		Tile prevPathedTile = unit.getStandingTile();
		for (int i = pathTiles.size() - 1; i >= 0; i--) {
			Tile pathTile = pathTiles.get(i);

			if (pathTile.equals(prevPathedTile))
				continue;
			// System.out.println("Comparing:" + prevPathedTile + " | " + pathTile);

			movementCost += unit.getMovementCost(prevPathedTile, pathTile);

			if (movementCost > unit.getMovement()) {
				pathingTile = prevPathedTile;
				break;
			}

			if (movementCost == unit.getMovement() || pathTile.equals(targetTile)) {
				pathingTile = pathTile;
				break;
			}

			prevPathedTile = pathTile;
			index++;
		}

		// System.out.println("Walking to: " + pathingTile);

		return pathingTile;
	}
}
