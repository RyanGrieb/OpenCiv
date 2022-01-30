package me.rhin.openciv.server.game.ai.behavior.nodes;

import java.util.ArrayList;
import java.util.Random;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;

public class ApproachVunerableCityNode extends UnitNode {

	public ApproachVunerableCityNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {
		AbstractPlayer player = unit.getPlayerOwner();

		City city = player.getNearestCityToEnemy();

		if (city == null) {
			setStatus(BehaviorStatus.FAILURE);
			return;
		}

		Tile targetTile = city.getTile();

		boolean moved = unit.moveToTile(targetTile);

		if (moved)
			setStatus(BehaviorStatus.SUCCESS);
		else
			setStatus(BehaviorStatus.FAILURE);
	}

}
