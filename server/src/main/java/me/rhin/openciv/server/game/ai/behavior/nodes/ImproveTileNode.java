
package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.map.tile.improvement.TileImprovement;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Builder.BuilderUnit;

public class ImproveTileNode extends UnitNode {

	public ImproveTileNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public BehaviorResult tick() {
		BuilderUnit builder = (BuilderUnit) unit;
		TileImprovement tileImprovement = builder.getImprovementFromTile(builder.getTile());

		builder.setBuilding(true);
		builder.setImprovement(tileImprovement.getName());
		builder.reduceMovement(2);

		return new BehaviorResult(BehaviorStatus.SUCCESS, this);
	}

}
