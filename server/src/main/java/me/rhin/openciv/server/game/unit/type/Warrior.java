package me.rhin.openciv.server.game.unit.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.server.game.unit.UnitItem.UnitItemType;

public class Warrior extends UnitItem {

	public Warrior(City city) {
		super(city);
	}

	public static class WarriorUnit extends Unit {

		public WarriorUnit(Player playerOwner, Tile standingTile) {
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
			return 20;
		}
	}

	@Override
	public float getUnitProductionCost() {
		return 40;
	}

	@Override
	public float getGoldCost() {
		return 100;
	}
	
	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}
	
	@Override
	public String getName() {
		return "Warrior";
	}

	@Override
	protected UnitItemType getUnitItemType() {
		return UnitItemType.MELEE;
	}
}
