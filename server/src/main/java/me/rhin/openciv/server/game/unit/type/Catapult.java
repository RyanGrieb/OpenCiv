package me.rhin.openciv.server.game.unit.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.research.type.MathematicsTech;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.RangedUnit;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;

public class Catapult extends UnitItem {

	public Catapult(City city) {
		super(city);
	}

	public static class CatapultUnit extends Unit implements RangedUnit {

		public CatapultUnit(Player playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public int getCombatStrength() {
			return 7;
		}

		@Override
		public int getRangedCombatStrength(AttackableEntity target) {
			if (target instanceof City) {
				// FIXME: Support floats.
				return (int) (7 * 1.75);
			}
			return 7;
		}
	}

	@Override
	public float getUnitProductionCost() {
		return 75;
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(MathematicsTech.class);
	}

	@Override
	public String getName() {
		return "Catapult";
	}

	@Override
	public UnitItemType getUnitItemType() {
		return UnitItemType.RANGED;
	}
}