package me.rhin.openciv.server.game.ai.behavior.nodes;

import java.util.ArrayList;
import java.util.Random;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;

public class ApproachEnemyCityNode extends UnitNode {

	public ApproachEnemyCityNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {

		AbstractPlayer player = unit.getPlayerOwner();
		City nearestEnemyCity = null; // Nearest city by the enemy
		float distance = Integer.MAX_VALUE;

		ArrayList<City> enemyCities = new ArrayList<>();

		for (AbstractPlayer enemyPlayer : player.getDiplomacy().getEnemies()) {
			enemyCities.addAll(enemyPlayer.getOwnedCities());
		}

		for (City enemyCity : enemyCities) {
			for (City city : player.getOwnedCities()) {
				if (nearestEnemyCity == null || city.getTile().getDistanceFrom(enemyCity.getTile()) < distance) {
					distance = city.getTile().getDistanceFrom(enemyCity.getTile());
					nearestEnemyCity = enemyCity;
				}
			}
		}

		if (nearestEnemyCity == null) {
			setStatus(BehaviorStatus.FAILURE);
			return;
		}

		Tile targetTile = nearestEnemyCity.getTile();

		
		boolean moved = unit.moveToTile(targetTile);

		if (moved)
			setStatus(BehaviorStatus.SUCCESS);
		else
			setStatus(BehaviorStatus.FAILURE);
	}

}
