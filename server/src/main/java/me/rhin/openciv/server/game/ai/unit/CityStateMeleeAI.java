package me.rhin.openciv.server.game.ai.unit;

import java.util.ArrayList;
import java.util.Random;

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
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.server.listener.ServerSettleCityListener;

public class CityStateMeleeAI extends UnitAI implements NextTurnListener, ServerSettleCityListener {

	private City city;
	private Tile targetTile;

	public CityStateMeleeAI(Unit unit) {
		super(unit);

		if (unit.getPlayerOwner().getOwnedCities().size() > 0)
			this.city = unit.getPlayerOwner().getCapitalCity();

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Server.getInstance().getEventManager().addListener(ServerSettleCityListener.class, this);
	}

	@Override
	public void onNextTurn() {
		moveUnit();
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

	private void moveUnit() {
		if (!unit.isAlive())
			return;

		if (targetTile != null && targetTile.equals(unit.getStandingTile()))
			targetTile = null;

		// If we were attacking,
		if (unit.getHealth() <= 60 && !unit.getTile().equals(city.getOriginTile())) {
			targetTile = null;
		}

		if (targetTile == null)
			findTargets();

		moveToTarget();
	}

	private void moveToTarget() {

		if (targetTile == null)
			return;

		ArrayList<Tile> pathTiles = new ArrayList<>();
		pathTiles = getPathTiles(targetTile);

		// If we don't have a valid path, return.
		if (pathTiles.size() < 1 || unit.getStandingTile().equals(targetTile)) {
			targetTile = null;
			return;
		}

		Tile pathingTile = stepTowardTarget(pathTiles);

		if (pathingTile == null)
			return;

		Unit topUnit = pathingTile.getTopUnit();

		// If our target tile already has a unit on top. Move elsewhere
		if (topUnit != null && isFriendly(topUnit)) {
			pathingTile = unit.getStandingTile();
			targetTile = null;

			// FIXME: Find a way to call this w/ out potential infinite loop
			// moveUnit();
			return;
		}

		AttackableEntity topEntity = pathingTile.getEnemyAttackableEntity(unit.getPlayerOwner());
		if (topEntity != null && topEntity.surviveAttack(unit)) {
			pathingTile = pathTiles.get(1); // Stand outside of enemy unit to attack.
		}

		if (!pathingTile.equals(unit.getStandingTile()))
			moveToTargetTile(pathingTile);

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

	private boolean isFriendly(Unit unit) {
		if (unit.getPlayerOwner() instanceof Player || unit.getPlayerOwner() instanceof CityStatePlayer)
			return true;

		return unit.getPlayerOwner().equals(city.getPlayerOwner()) && !unit.getUnitTypes().contains(UnitType.SUPPORT);
	}

	private void findTargets() {

		// Walk back to city if under threat
		if (doRetreatTargetCheck()) {
			// System.out.println("Retreating: " + unit.getID());
			return;
		}
		// Walk towards enemy units
		if (doEnemyTargetCheck()) {
			// System.out.println("Attacking as: " + unit.getID());
			return;
		}
		// Walk to a random tile
		doRandomTarget();

		// System.out.println("Guarding to:" + targetTile);
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
			if (tile == null)
				continue;
			if (tile.containsTileType(TileType.BARBARIAN_CAMP)) {
				targetTile = tile;
				return;
			}
		}

		ArrayList<Tile> tiles = getSurroundingTiles(unit.getTile());

		if (unit.getStandingTile().getTerritory() != null && unit.getStandingTile().getTerritory().equals(city)) {
			targetTile = getRandomTargetTile(tiles);
		} else
			targetTile = getRandomTargetTile(city.getTerritory());
	}

	private Tile getRandomTargetTile(ArrayList<Tile> tiles) {

		Random rnd = new Random();

		Tile rndTile = null;

		// While no rndTile, rndTile = water, rndTile is mountain, rndTile contains
		// Friendly unit. Pick random tile.
		int index = 0;
		while (rndTile == null || rndTile.containsTileProperty(TileProperty.WATER) || rndTile.getMovementCost() > 10
				|| rndTile.getCity() != null || (rndTile.getUnits().size() > 0 && isFriendly(rndTile.getTopUnit())
						&& !rndTile.getTopUnit().getUnitTypes().contains(UnitType.SUPPORT))) {

			if (index > 30)
				return null;

			rndTile = tiles.get(rnd.nextInt(tiles.size()));

			index++;
		}

		return rndTile;
	}

	private boolean doRetreatTargetCheck() {

		Tile retreatTile = city.getOriginTile();

		Random rnd = new Random();

		int index = 0;
		while (retreatTile.getTopUnit() != null && !unit.equals(retreatTile.getTopUnit())
				&& !retreatTile.getTopUnit().getUnitTypes().contains(UnitType.SUPPORT)) {

			if (index > 30)
				return false;

			retreatTile = city.getTerritory().get(rnd.nextInt(city.getTerritory().size()));
			index++;
		}

		// Even if were still in the city, don't move if were really low
		if (unit.getHealth() <= 20) {
			targetTile = retreatTile;
			return true;
		}

		if (unit.getStandingTile().equals(city.getTile()))
			return false;

		if (((AIPlayer) unit.getPlayerOwner()).getIntimidation() > 15
				&& (targetTile == null || !targetTile.equals(city.getTile()))) {
			targetTile = retreatTile;
			return true;
		}

		if (unit.getHealth() <= 60) {
			targetTile = retreatTile;
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
