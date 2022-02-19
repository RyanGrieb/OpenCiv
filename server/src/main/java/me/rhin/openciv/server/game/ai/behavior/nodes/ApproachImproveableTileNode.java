package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Builder.BuilderUnit;

public class ApproachImproveableTileNode extends UnitNode {

	public ApproachImproveableTileNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public BehaviorResult tick() {
		BuilderUnit builder = (BuilderUnit) unit;

		// FIXME: Handle other builders approaching the same tile?
		Tile targetTile = null;

		mainLoop: for (City city : unit.getPlayerOwner().getOwnedCities()) {
			
			for (Tile tile : city.getTerritory()) {

				if (builder.getImprovementFromTile(tile) != null) {
					targetTile = tile;
					break mainLoop;
				}

			}

		}

		if (targetTile == null) {
			return new BehaviorResult(BehaviorStatus.FAILURE, this);
		}

		boolean moved = unit.moveToTile(targetTile);

		if (!moved) {
			return new BehaviorResult(BehaviorStatus.FAILURE, this);
		}
		
		return new BehaviorResult(BehaviorStatus.SUCCESS, this);
	}

}
