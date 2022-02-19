package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
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
	public BehaviorResult tick() {
		AbstractPlayer player = unit.getPlayerOwner();

		City city = player.getNearestCityToEnemy();

		if (city == null) {
			return new BehaviorResult(BehaviorStatus.FAILURE, this);
		}

		Tile targetTile = city.getTile();

		boolean moved = unit.moveToTile(targetTile);

		if (moved)
			return new BehaviorResult(BehaviorStatus.SUCCESS, this);
		else
			return new BehaviorResult(BehaviorStatus.FAILURE, this);
	}

}
