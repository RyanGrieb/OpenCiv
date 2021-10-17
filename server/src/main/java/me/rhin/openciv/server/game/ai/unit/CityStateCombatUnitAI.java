package me.rhin.openciv.server.game.ai.unit;

import java.util.ArrayList;
import java.util.Random;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.ai.AIPlayer;
import me.rhin.openciv.server.game.ai.type.CityStatePlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.server.listener.ServerSettleCityListener;
import me.rhin.openciv.server.listener.SettleCityListener;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;

public class CityStateCombatUnitAI extends UnitAI implements NextTurnListener, ServerSettleCityListener {

	private City city;
	private Tile targetTile;

	public CityStateCombatUnitAI(Unit unit) {
		super(unit);

		if (unit.getPlayerOwner().getOwnedCities().size() > 0)
			this.city = unit.getPlayerOwner().getCapitalCity();

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Server.getInstance().getEventManager().addListener(ServerSettleCityListener.class, this);
	}

	// Problem, we don't clear listeners?
	// Dead units still get called.
	@Override
	public void onNextTurn() {

		if (!unit.isAlive())
			return;

		// TODO: Don't set target if there is a unit inside.
		if (unit.getHealth() <= 60 && !unit.getTile().equals(city.getOriginTile())) {
			targetTile = null;
		}

		if (targetTile == null)
			findTargets();

		moveToTarget();
	}

	@Override
	public void onSettleCity(City city) {
		if (city.getPlayerOwner().equals(unit.getPlayerOwner()))
			this.city = city;
	}

	@Override
	public void clearListeners() {
		Server.getInstance().getEventManager().removeListener(ServerSettleCityListener.class, this);
		Server.getInstance().getEventManager().removeListener(NextTurnListener.class, this);
	}

	private void moveToTarget() {

		ArrayList<Tile> pathTiles = new ArrayList<>();
		pathTiles = getPathTiles(targetTile);

		// If we don't have a valid path, return.
		if (targetTile == null || pathTiles.size() < 1 || unit.getStandingTile().equals(targetTile)) {
			targetTile = null;
			return;
		}

		Tile pathingTile = stepTowardTarget(pathTiles);

		if (pathingTile == null)
			return;

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

		if (unit.getHealth() > 0) {
			// Handle capturing barbarian camps
			if (unit.getStandingTile().containsTileType(TileType.BARBARIAN_CAMP)) {
				unit.captureBarbarianCamp();
			}
		}

		if (unit.getStandingTile().equals(targetTile))
			targetTile = null;
	}

	private void findTargets() {

		// Walk back to city if under threat
		if (doRetreatTargetCheck()) {
			//System.out.println("Retreating: " + unit.getID());
			return;
		}
		// Walk towards enemy units
		if (doEnemyTargetCheck()) {
			//System.out.println("Attacking as: " + unit.getID());
			return;
		}
		// Walk to a random tile
		doRandomTarget();

		//System.out.println("Guarding to:" + targetTile);
	}

	private void doRandomTarget() {

		// Clear barbarian camps
		// TODO: Store discovered barbarian camps in memory
		// Instead of forgetting next turn

		// Get surrounding tiles of all units.
		ArrayList<Tile> visibleTiles = new ArrayList<>();
		for (Unit unit : unit.getPlayerOwner().getOwnedUnits())
			for (Tile tile1 : unit.getStandingTile().getAdjTiles()) {
				if (!visibleTiles.contains(tile1))
					visibleTiles.add(tile1);
				for (Tile tile2 : tile1.getAdjTiles()) {
					if (!visibleTiles.contains(tile2))
						visibleTiles.add(tile2);
				}
			}

		// Get surrounding tiles of all cities.
		for (City city : unit.getPlayerOwner().getOwnedCities()) {
			for (Tile tile : city.getTerritory()) {
				if (!visibleTiles.contains(tile))
					visibleTiles.add(tile);

				for (Tile outterTile : tile.getAdjTiles())
					if (!visibleTiles.contains(outterTile))
						visibleTiles.add(outterTile);
			}
		}

		for (Tile tile : visibleTiles) {
			if (tile.containsTileType(TileType.BARBARIAN_CAMP)) {
				targetTile = tile;
				return;
			}
		}

		ArrayList<Tile> tiles = getSurroundingTiles(unit.getTile());
		Random rnd = new Random();
		if (unit.getStandingTile().getTerritory() != null && unit.getStandingTile().getTerritory().equals(city)) {
			while (targetTile == null || targetTile.containsTileProperty(TileProperty.WATER)
					|| targetTile.getMovementCost() > 10)
				targetTile = tiles.get(rnd.nextInt(tiles.size()));
		} else
			targetTile = city.getTerritory().get(rnd.nextInt(city.getTerritory().size()));
	}

	private boolean doRetreatTargetCheck() {

		// Even if were still in the city, don't move if were really low
		if (unit.getHealth() <= 20) {
			targetTile = city.getOriginTile();
			return true;
		}

		if (unit.getStandingTile().equals(city.getTile()))
			return false;

		if (((AIPlayer) unit.getPlayerOwner()).getIntimidation() > 15
				&& (targetTile == null || !targetTile.equals(city.getTile()))) {
			targetTile = city.getOriginTile();
			return true;
		}

		if (unit.getHealth() <= 60) {
			targetTile = city.getOriginTile();
			return true;
		}

		return false;
	}

	private boolean doEnemyTargetCheck() {
		// Walk to enemy units

		ArrayList<Tile> tiles = getSurroundingTiles(unit.getStandingTile());

		// TODO: Target lowest health unit.
		for (Tile tile : tiles) {
			AttackableEntity enemyEntity = tile.getEnemyAttackableEntity(unit.getPlayerOwner());

			// FIXME: Determine if were at war w/ this player. Currently we don't attack
			// these players
			if (enemyEntity == null || enemyEntity.getPlayerOwner() instanceof Player
					|| enemyEntity.getPlayerOwner() instanceof CityStatePlayer)
				continue;

			targetTile = enemyEntity.getTile();
			return true;
		}

		return false;
	}

	private ArrayList<Tile> getSurroundingTiles(Tile tile) {

		ArrayList<Tile> tiles = new ArrayList<>();
		for (Tile tile1 : tile.getAdjTiles()) {
			if (!tiles.contains(tile1))
				tiles.add(tile1);

			for (Tile tile2 : tile1.getAdjTiles()) {
				if (!tiles.contains(tile2))
					tiles.add(tile2);
			}
		}

		return tiles;
	}
}
