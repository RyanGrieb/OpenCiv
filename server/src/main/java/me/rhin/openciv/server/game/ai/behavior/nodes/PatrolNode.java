package me.rhin.openciv.server.game.ai.behavior.nodes;

import java.util.Random;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;

public class PatrolNode extends UnitNode {

	private City patrolCity;
	private int turnsPatrolled;
	private Tile targetTile;

	public PatrolNode(Unit unit, String name) {
		super(unit, name);
		turnsPatrolled = 0;
	}

	@Override
	public void tick() {

		System.out.println(patrolCity);

		Random rnd = new Random();
		if (patrolCity == null || turnsPatrolled > 9) {
			patrolCity = unit.getPlayerOwner().getOwnedCities()
					.get(rnd.nextInt(unit.getPlayerOwner().getOwnedCities().size()));

			turnsPatrolled = 0;
		}

		boolean waterUnit = unit.getUnitTypes().contains(UnitType.NAVAL);

		while (targetTile == null || targetTile.equals(unit.getStandingTile())
				|| (targetTile.containsTileProperty(TileProperty.WATER) && !waterUnit)) {
			targetTile = patrolCity.getObservedTiles().get(rnd.nextInt(patrolCity.getObservedTiles().size()))
					.getAdjTiles()[rnd.nextInt(6)];
		}

		boolean moved = unit.moveToTile(targetTile);
		if (!moved) {
			targetTile = null;
			tick();
		}

		// FIXME: Set it to success?
		setStatus(BehaviorStatus.SUCCESS);
	}

}
