package me.rhin.openciv.server.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.shared.stat.Stat;

public class Settler extends UnitItem {

	public Settler(City city) {
		super(city);
	}

	public static class SettlerUnit extends Unit {

		public SettlerUnit(AbstractPlayer playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);

			combatStrength.setValue(Stat.COMBAT_STRENGTH, 0);
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public boolean isUnitCapturable() {
			return true;
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.SUPPORT);
		}
	}

	@Override
	public float getUnitProductionCost() {
		return 80;
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}

	@Override
	public String getName() {
		return "Settler";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.SUPPORT);
	}
}
