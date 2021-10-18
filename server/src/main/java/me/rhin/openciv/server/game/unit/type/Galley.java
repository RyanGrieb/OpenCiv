package me.rhin.openciv.server.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.research.type.SailingTech;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.shared.stat.Stat;

public class Galley extends UnitItem {

	public Galley(City city) {
		super(city);
	}

	public static class GalleyUnit extends Unit {

		public GalleyUnit(AbstractPlayer playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);

			combatStrength.setValue(Stat.COMBAT_STRENGTH, 30);
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (!tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.MELEE, UnitType.NAVAL);
		}
	}

	@Override
	public float getUnitProductionCost() {
		return 45;
	}

	@Override
	public float getGoldCost() {
		return 150;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.isCoastal() && city.getPlayerOwner().getResearchTree().hasResearched(SailingTech.class);
	}

	@Override
	public String getName() {
		return "Galley";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.MELEE, UnitType.NAVAL);
	}

	@Override
	public float getBaseCombatStrength() {
		return 30;
	}
}
