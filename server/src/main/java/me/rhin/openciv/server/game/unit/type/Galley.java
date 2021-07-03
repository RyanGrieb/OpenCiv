package me.rhin.openciv.server.game.unit.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.research.type.SailingTech;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;

public class Galley extends UnitItem {

	public Galley(City city) {
		super(city);
	}

	public static class GalleyUnit extends Unit {

		public GalleyUnit(Player playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);
		}

		@Override
		public int getMovementCost(Tile prevTile, Tile tile) {
			if (!tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public int getCombatStrength() {
			return 30;
		}
	}

	@Override
	public int getProductionCost() {
		return 45;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.isCoastal() && city.getPlayerOwner().getResearchTree().hasResearched(SailingTech.class);
	}
	
	@Override
	public String getName() {
		return "Galley";
	}
}
