package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.heritage.type.rome.LegionHeritage;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.IronWorkingTech;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;

public class Legion extends UnitItem {

	public Legion(City city) {
		super(city);
	}

	public static class LegionUnit extends Unit {

		public LegionUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_LEGION);
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.MELEE);
		}

		@Override
		public boolean canUpgrade() {
			return false;
		}
	}

	@Override
	protected float getUnitProductionCost() {
		return 75;
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public boolean meetsProductionRequirements() {

		if (!city.getPlayerOwner().getHeritageTree().hasStudied(LegionHeritage.class))
			return false;

		boolean workedIron = false;
		for (Tile tile : city.getTerritory()) {
			if (tile.containsTileType(TileType.IRON_IMPROVED))
				workedIron = true;
		}
		return city.getPlayerOwner().getResearchTree().hasResearched(IronWorkingTech.class) && workedIron;
	}

	@Override
	public String getName() {
		return "Legion";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_LEGION;
	}

	@Override
	public String getDesc() {
		return "The backbone of the Roman army. \n Requires a worked iron tile.";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.MELEE);
	}

}
