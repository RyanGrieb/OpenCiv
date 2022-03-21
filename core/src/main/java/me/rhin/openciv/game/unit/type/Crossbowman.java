package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.MachineryTech;
import me.rhin.openciv.game.unit.AttackableEntity;
import me.rhin.openciv.game.unit.RangedUnit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;

public class Crossbowman extends UnitItem {

	public Crossbowman(City city) {
		super(city);
	}

	public static class CrossbowmanUnit extends RangedUnit {

		public CrossbowmanUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_CROSSBOWMAN);
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
			return Arrays.asList(UnitType.RANGED);
		}

		@Override
		public boolean canUpgrade() {
			return false;
		}
	}

	@Override
	protected float getUnitProductionCost() {
		return 120;
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(MachineryTech.class);
	}

	@Override
	public String getName() {
		return "Crossbowman";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_CROSSBOWMAN;
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("A powerful medieval ranged unit.");
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.RANGED);
	}

}
