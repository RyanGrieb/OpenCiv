package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.BronzeWorkingTech;
import me.rhin.openciv.game.unit.AttackableEntity;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.game.unit.UnitItem.UnitType;

public class Spearman extends UnitItem {

	public Spearman(City city) {
		super(city);
	}

	public static class SpearmanUnit extends Unit {

		public SpearmanUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_SPEARMAN);
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
		return 56;
	}

	@Override
	public float getGoldCost() {
		return 175;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(BronzeWorkingTech.class);
	}

	@Override
	public String getName() {
		return "Spearman";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_SPEARMAN;
	}

	@Override
	public String getDesc() {
		return "An ancient disciplined melee \nunit. \n50% bonus towards mounted units.";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.MELEE);
	}
}