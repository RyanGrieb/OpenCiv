package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Builder.BuilderUnit;

/**
 * Returns SUCCESS if the builder is standing on a tile that can be improved.
 * 
 * @author Ryan
 *
 */
public class OnImproveableTileNode extends UnitNode {

	public OnImproveableTileNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {
		BuilderUnit builder = (BuilderUnit) unit;

		if (builder.getImprovementFromTile(builder.getTile()) != null && (builder.getTile().getTerritory() != null
				&& builder.getTile().getTerritory().getPlayerOwner().equals(unit.getPlayerOwner()))) {
			setStatus(BehaviorStatus.SUCCESS);
			return;
		}

		setStatus(BehaviorStatus.FAILURE);
	}

}
