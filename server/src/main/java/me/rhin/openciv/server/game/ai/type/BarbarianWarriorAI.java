package me.rhin.openciv.server.game.ai.type;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Random;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.ai.BarbarianPlayer;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;

public class BarbarianWarriorAI extends UnitAI implements NextTurnListener {

	private Unit unit;
	private Tile campTile;
	private Tile targetTile;
	private AbstractPlayer playerTarget;
	private Unit targetUnit;

	public BarbarianWarriorAI(Unit unit, Tile campTile) {
		this.unit = unit;
		this.campTile = campTile;

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {
		// Check if we found a target.

		// TODO: Consider tiles obstructing view.
		findTargets();

		if (playerTarget != null) {
			doTargetPath();
		} else {
			doScoutingPath();
		}
	}

	private void findTargets() {
		ArrayList<Tile> tiles = new ArrayList<>();
		for (Tile tile1 : unit.getStandingTile().getAdjTiles()) {
			if (!tiles.contains(tile1))
				tiles.add(tile1);

			for (Tile tile2 : tile1.getAdjTiles()) {
				if (!tiles.contains(tile2))
					tiles.add(tile2);
			}
		}

		for (Tile tile : tiles)
			for (Unit unit : tile.getUnits())
				if (!(unit.getPlayerOwner() instanceof BarbarianPlayer)) {
					playerTarget = unit.getPlayerOwner();
					targetUnit = unit;
					break;
				}
	}

	/**
	 * Track down and attack player units & cities
	 */
	private void doTargetPath() {

		// Change targetUnit if there are closer units.
		for (Tile tile : unit.getStandingTile().getAdjTiles()) {
			Unit enemyUnit = tile.getTopEnemyUnit(unit.getPlayerOwner());
			if (enemyUnit != null && !enemyUnit.equals(targetUnit)) {
				targetUnit = enemyUnit;
			}
		}

		targetTile = targetUnit.getStandingTile();

		ArrayList<Tile> pathTiles = getPathTiles(targetTile);
		Tile pathingTile = stepTowardTarget(pathTiles);

		if (pathingTile == null)
			return;

		// Assume were attacking a unit.
		// FIXME: Account for units in cities.
		if (pathingTile.getUnits().size() > 0) {
			pathingTile = pathTiles.get(1); // Stand outside of enemy unit to attack.
		}

		unit.setTargetTile(pathingTile);

		MoveUnitPacket packet = new MoveUnitPacket();
		packet.setUnit(unit.getPlayerOwner().getName(), unit.getID(), unit.getStandingTile().getGridX(),
				unit.getStandingTile().getGridY(), pathingTile.getGridX(), pathingTile.getGridY());
		packet.setMovementCost(unit.getPathMovement());

		unit.moveToTargetTile();
		unit.reduceMovement(unit.getPathMovement());

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers()) {
			player.sendPacket(json.toJson(packet));
		}

		Unit topEnemyUnit = targetUnit.getTile().getTopEnemyUnit(unit.getPlayerOwner());
		// If there is an enemy ontop of our targer, switch to the top unit
		if (topEnemyUnit != null && !topEnemyUnit.equals(targetUnit)) {
			this.targetUnit = topEnemyUnit;
		}

		// FIXME: Handle attacking units inside cities.
		if (unit.canAttack(targetUnit)) {

			if (targetUnit.getStandingTile().getCity() != null) {
				unit.attackEntity(targetUnit.getStandingTile().getCity());
			} else
				unit.attackEntity(targetUnit);

			// Walk onto the dead target unit. Kill/Capture surviving support units.
			if (!targetUnit.isAlive() && unit.isAlive()) {

				// Move onto the dead target.
				packet = new MoveUnitPacket();

				unit.setTargetTile(targetUnit.getStandingTile());
				packet.setUnit(unit.getPlayerOwner().getName(), unit.getID(), unit.getStandingTile().getGridX(),
						unit.getStandingTile().getGridY(), targetUnit.getStandingTile().getGridX(),
						targetUnit.getStandingTile().getGridY());
				packet.setMovementCost(unit.getPathMovement());

				unit.moveToTargetTile();
				unit.reduceMovement(unit.getPathMovement());

				for (Player player : Server.getInstance().getPlayers()) {
					player.sendPacket(json.toJson(packet));
				}

				// Kill remaining units.
				for (Unit enemyUnit : unit.getStandingTile().getUnits()) {
					if (!enemyUnit.isAlive() || enemyUnit.getPlayerOwner().equals(unit.getPlayerOwner()))
						continue;

					enemyUnit.getStandingTile().removeUnit(enemyUnit);
					enemyUnit.kill();
					enemyUnit.getPlayerOwner().removeUnit(enemyUnit);

					// FIXME: Redundant code.
					DeleteUnitPacket removeUnitPacket = new DeleteUnitPacket();
					removeUnitPacket.setUnit(enemyUnit.getID(), enemyUnit.getStandingTile().getGridX(),
							enemyUnit.getStandingTile().getGridY());
					removeUnitPacket.setKilled(true);

					for (Player player : Server.getInstance().getPlayers()) {
						player.sendPacket(json.toJson(removeUnitPacket));
					}
				}
			}
		}

		if (!targetUnit.isAlive()) {
			playerTarget = null;
			targetUnit = null;
			targetTile = null;
		}
	}

	private void doScoutingPath() {

		if (unit.getStandingTile().equals(targetTile)) {
			targetTile = campTile;
		}

		if (unit.getStandingTile().equals(campTile)) {
			targetTile = null;
		}

		// Get an initial random target tile.
		int index = 0;
		while (targetTile == null || targetTile.containsTileProperty(TileProperty.WATER)
				|| targetTile.getMovementCost() > 10) {

			if (index > 30)
				break;
			targetTile = getRandomTargetTile();
			index++;
		}

		ArrayList<Tile> pathTiles = new ArrayList<>();

		outerloop: while (pathTiles.size() < 1) {

			pathTiles = getPathTiles(targetTile);

			// If there is not a valid path, get another random target.
			if (pathTiles.size() < 1) {
				targetTile = null;
				index = 0;
				while (targetTile == null || targetTile.containsTileProperty(TileProperty.WATER)
						|| targetTile.getMovementCost() > 10) {

					if (index > 30)
						break outerloop;
					targetTile = getRandomTargetTile();
					index++;
				}

			}
		}

		if (targetTile == null || pathTiles.size() < 1)
			return;

		Tile pathingTile = stepTowardTarget(pathTiles);
		unit.setTargetTile(pathingTile);

		MoveUnitPacket packet = new MoveUnitPacket();
		packet.setUnit(unit.getPlayerOwner().getName(), unit.getID(), unit.getStandingTile().getGridX(),
				unit.getStandingTile().getGridY(), pathingTile.getGridX(), pathingTile.getGridY());
		packet.setMovementCost(unit.getPathMovement());

		unit.moveToTargetTile();
		unit.reduceMovement(unit.getPathMovement());

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers()) {
			player.sendPacket(json.toJson(packet));
		}
	}

	private Tile getRandomTargetTile() {
		Tile targetTile = null;

		Random rnd = new Random();
		int width = Server.getInstance().getMap().getWidth();
		int height = Server.getInstance().getMap().getHeight();
		targetTile = Server.getInstance().getMap().getTiles()[rnd.nextInt(width)][rnd.nextInt(height)];

		return targetTile;
	}

	// TODO: Make this a universal method
	private ArrayList<Tile> getPathTiles(Tile targetTile) {

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
	private Tile stepTowardTarget(ArrayList<Tile> pathTiles) {

		Tile pathingTile = null;
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
			// movement cost. Hard to re-create.
			if (index > 0) {
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

		return pathingTile;
	}
}
