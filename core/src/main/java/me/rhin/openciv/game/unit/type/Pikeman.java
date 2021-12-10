package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.CivilServiceTech;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;

public class Pikeman extends UnitItem {

	public Pikeman(City city) {
		super(city);
	}

	public static class PikemanUnit extends Unit {

		public PikemanUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_PIKEMAN);
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
		return 90;
	}

	@Override
	public float getGoldCost() {
		return 225;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(CivilServiceTech.class);
	}

	@Override
	public String getName() {
		return "Pikeman";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_PIKEMAN;
	}

	@Override
	public String getDesc() {
		return "An medieval melee unit. \n50% bonus towards mounted units.";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.MELEE);
	}
	
}
