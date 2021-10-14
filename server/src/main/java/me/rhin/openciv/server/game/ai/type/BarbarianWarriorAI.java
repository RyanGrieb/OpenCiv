package me.rhin.openciv.server.game.ai.type;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Random;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;

public class BarbarianWarriorAI extends UnitAI implements NextTurnListener {

	private Unit unit;
	private Tile campTile;
	private Tile targetTile;
	private boolean leavingCamp;
	private boolean foundTarget;

	public BarbarianWarriorAI(Unit unit, Tile campTile) {
		this.unit = unit;
		this.campTile = campTile;
		this.leavingCamp = true;

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {

		// Check if we found a target.

		if (foundTarget) {
			doTargetPath();
		} else {
			doScoutingPath();
		}
	}

	private void doTargetPath() {

	}

	private void doScoutingPath() {

		if (unit.getStandingTile().equals(targetTile)) {
			targetTile = campTile;
		}

		if (unit.getStandingTile().equals(campTile)) {
			targetTile = null;
		}

		Tile pathingTile = null;

		Random rnd = new Random();
		int width = Server.getInstance().getMap().getWidth();
		int height = Server.getInstance().getMap().getHeight();

		while (targetTile == null || targetTile.containsTileProperty(TileProperty.WATER)
				|| targetTile.getMovementCost() > 10) {
			targetTile = Server.getInstance().getMap().getTiles()[rnd.nextInt(width)][rnd.nextInt(height)];
		}

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

				float tenativeGScore = gScores[current.getGridX()][current.getGridY()]
						+ unit.getMovementCost(current, adjTile);

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
		pathTiles.add(targetTile);

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

		int index = 0;
		float movementCost = 0;
		Tile prevPathedTile = unit.getStandingTile();
		for (int i = pathTiles.size() - 1; i >= 0; i--) {
			Tile pathTile = pathTiles.get(i);

			if (i == 0) {
				pathingTile = pathTile;
				break;
			}

			// FIXME: When the AI is about to reach the final destination. It ignores
			// movement cost.
			if (index > 0) {
				System.out.println("looking:" + prevPathedTile + "," + pathTile);
				movementCost += unit.getMovementCost(prevPathedTile, pathTile);
			}

			if (movementCost > unit.getMovement()) {
				pathingTile = prevPathedTile;
				break;
			}

			// System.out.println(pathTile);
			if (index > 1 || movementCost == unit.getMovement()) {
				pathingTile = pathTile;
				break;
			}

			prevPathedTile = pathTile;
			index++;
		}

		unit.setTargetTile(pathingTile);

		// System.out.println("OLD:" + unit.getStandingTile().getGridX() + "," +
		// unit.getStandingTile().getGridY()
		// + " || NEW:" + targetTile.getGridX() + ", " + targetTile.getGridY());

		MoveUnitPacket packet = new MoveUnitPacket();
		packet.setUnit(unit.getPlayerOwner().getName(), unit.getID(), unit.getStandingTile().getGridX(),
				unit.getStandingTile().getGridY(), pathingTile.getGridX(), pathingTile.getGridY());
		packet.setMovementCost(unit.getPathMovement());

		unit.moveToTargetTile();
		unit.reduceMovement(unit.getPathMovement());

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers()) {
			player.getConn().send(json.toJson(packet));
		}
	}

}
