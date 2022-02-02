package me.rhin.openciv.server.game.ai.behavior.nodes;

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
	public void tick() {
		BuilderUnit builder = (BuilderUnit) unit;

		// FIXME: Handle other builders approaching the same tile?
		Tile targetTile = null;

		mainLoop: for (City city : unit.getPlayerOwner().getOwnedCities()) {
			
			System.out.println(city.getTerritory());
			
			for (Tile tile : city.getTerritory()) {

				if (builder.getImprovementFromTile(tile) != null) {
					targetTile = tile;
					break mainLoop;
				}

			}

		}

		if (targetTile == null) {
			setStatus(BehaviorStatus.FAILURE);
			return;
		}

		boolean moved = unit.moveToTile(targetTile);

		if (!moved) {
			setStatus(BehaviorStatus.FAILURE);
			return;
		}
		
		setStatus(BehaviorStatus.SUCCESS);
	}

}
