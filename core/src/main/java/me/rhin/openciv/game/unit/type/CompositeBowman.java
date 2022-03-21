package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.ConstructionTech;
import me.rhin.openciv.game.research.type.MachineryTech;
import me.rhin.openciv.game.unit.AttackableEntity;
import me.rhin.openciv.game.unit.RangedUnit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;

public class CompositeBowman extends UnitItem {

	public CompositeBowman(City city) {
		super(city);
	}

	public static class CompositeBowmanUnit extends RangedUnit {

		public CompositeBowmanUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_COMPOSITE_BOWMAN);
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
			return playerOwner.getResearchTree().hasResearched(MachineryTech.class);
		}
	}

	@Override
	protected float getUnitProductionCost() {
		return 75;
	}

	@Override
	public float getGoldCost() {
		return 150;
	}

	@Override
	public boolean meetsProductionRequirements() {

		// Crossbowman can be built.
		if (city.getPlayerOwner().getResearchTree().hasResearched(MachineryTech.class))
			return false;

		return city.getPlayerOwner().getResearchTree().hasResearched(ConstructionTech.class);
	}

	@Override
	public String getName() {
		return "Composite Bowman";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_COMPOSITE_BOWMAN;
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("A classical ranged unit.");
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.RANGED);
	}

}
