package me.rhin.openciv.server.game.ai.unit;

import java.util.ArrayList;
import java.util.Random;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.ai.type.CityStatePlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.RangedUnit;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.server.listener.ServerSettleCityListener;

public class CityStateRangedAI extends UnitAI implements NextTurnListener, ServerSettleCityListener {

	private City city;
	private Tile targetTile;

	public CityStateRangedAI(Unit unit) {
		super(unit);

		if (unit.getPlayerOwner().getOwnedCities().size() > 0)
			this.city = unit.getPlayerOwner().getCapitalCity();

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Server.getInstance().getEventManager().addListener(ServerSettleCityListener.class, this);
	}

	@Override
	public void onSettleCity(City city) {
		if (city.getPlayerOwner().equals(unit.getPlayerOwner()))
			this.city = city;
	}

	@Override
	public void onNextTurn() {
		moveUnit();
	}

	@Override
	public void clearListeners() {
		Server.getInstance().getEventManager().removeListener(NextTurnListener.class, this);
		Server.getInstance().getEventManager().removeListener(ServerSettleCityListener.class, this);
	}

	private void moveUnit() {
		if (!unit.isAlive())
			return;

		if (targetTile != null && targetTile.equals(unit.getStandingTile()))
			targetTile = null;

		findTargets();
	}

	private void findTargets() {

		// Walk back to city if under threat
		if (doRetreatTargetCheck()) {
			moveToTarget();
			//System.out.println("Retreating: " + unit.getID() + ", " + unit.getName());
		}

		// Attack any enemy units in range if we still have movement left.
		if (doEnemyTargetCheck()) {
			//System.out.println("Attacking: " + unit.getID() + ", " + unit.getName());
			return;
		}

		if (unit.getMovement() < 1)
			return;

		// Walk to a random tile
		doRandomTarget();
		//System.out.println("Scouting as: " + unit.getID());
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
		if (topEntity != null) {
			pathingTile = pathTiles.get(1); // Stand outside of enemy unit to attack.
		}

		if (!pathingTile.equals(unit.getStandingTile()))
			moveToTargetTile(pathingTile);

		if (unit.getHealth() > 0) {
			// Handle capturing barbarian camps
			if (unit.getStandingTile().containsTileType(TileType.BARBARIAN_CAMP)) {
				unit.captureBarbarianCamp();
			}
		}

		if (unit.getStandingTile().equals(targetTile))
			targetTile = null;
	}

	private boolean doEnemyTargetCheck() {
		if (unit.getMovement() < 1)
			return false;

		for (Tile tile : unit.getObservedTiles()) {
			if (tile.getEnemyAttackableEntity(unit.getPlayerOwner()) != null) {

				((RangedUnit) unit).rangeAttack(tile.getEnemyAttackableEntity(unit.getPlayerOwner()));
				return true;
			}
		}

		return false;
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

		for (Tile tile : unit.getObservedTiles()) {
			if (tile.getTopEnemyUnit(unit.getPlayerOwner()) != null) {
				targetTile = retreatTile;
				return true;
			}

		}

		return false;
	}

	private void doRandomTarget() {
		if (unit.getStandingTile().getTerritory() != null && unit.getStandingTile().getTerritory().equals(city)) {
			targetTile = getRandomTargetTile(unit.getObservedTiles());
		} else {
			targetTile = getRandomTargetTile(city.getTerritory());
		}
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

	private boolean isFriendly(Unit unit) {
		if (unit.getPlayerOwner() instanceof Player || unit.getPlayerOwner() instanceof CityStatePlayer)
			return true;

		return unit.getPlayerOwner().equals(city.getPlayerOwner()) && !unit.getUnitTypes().contains(UnitType.SUPPORT);
	}
}
