package me.rhin.openciv.server.game.ai.unit;

import java.util.ArrayList;
import java.util.Random;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.ai.type.BarbarianPlayer;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;

public class BarbarianWarriorAI extends UnitAI implements NextTurnListener {

	private Tile campTile;
	private Tile targetTile;
	private AttackableEntity targetEntity;

	public BarbarianWarriorAI(Unit unit, Tile campTile) {
		super(unit);
		this.campTile = campTile;

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {
		if (!unit.isAlive())
			return;
		// Check if we found a target.

		// TODO: Consider tiles obstructing view.
		findTargets();

		if (targetEntity != null) {
			doTargetPath();
		} else {
			doScoutingPath();
		}
	}

	@Override
	public void clearListeners() {
		Server.getInstance().getEventManager().removeListener(NextTurnListener.class, this);
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

		for (Tile tile : tiles) {
			AttackableEntity enemyEntity = tile.getEnemyAttackableEntity(unit.getPlayerOwner());
			if (enemyEntity != null && !(enemyEntity.getPlayerOwner() instanceof BarbarianPlayer)) {
				targetEntity = enemyEntity;
				break;
			}
		}
	}

	/**
	 * Track down and attack player units & cities
	 */
	private void doTargetPath() {

		// Change targetUnit if there are closer units.
		for (Tile tile : unit.getStandingTile().getAdjTiles()) {
			AttackableEntity enemyEntity = tile.getEnemyAttackableEntity(unit.getPlayerOwner());
			if (enemyEntity != null && !enemyEntity.equals(targetEntity)) {
				targetEntity = enemyEntity;
			}
		}

		targetTile = targetEntity.getTile();

		ArrayList<Tile> pathTiles = getPathTiles(targetTile);
		Tile pathingTile = stepTowardTarget(pathTiles);

		if (pathingTile == null)
			return;

		// Assume were attacking a unit.
		// FIXME: Account for units in cities.
		AttackableEntity topEntity = pathingTile.getEnemyAttackableEntity(unit.getPlayerOwner());

		if (topEntity != null && topEntity.surviveAttack(unit)) {
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

		if (unit.canAttack(topEntity)) {
			unit.attackEntity(topEntity);
		}

		if (targetEntity.getHealth() <= 0 || targetEntity.getPlayerOwner().equals(unit.getPlayerOwner())) {
			targetEntity = null;
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

		if (targetTile == null)
			return;

		ArrayList<Tile> pathTiles = new ArrayList<>();

		index = 0;
		outerloop: while (pathTiles.size() < 1) {

			pathTiles = getPathTiles(targetTile);

			// If there is not a valid path, get another random target.
			if (pathTiles.size() < 1) {
				targetTile = null;
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
}
