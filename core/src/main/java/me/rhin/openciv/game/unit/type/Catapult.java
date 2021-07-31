package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.MathematicsTech;
import me.rhin.openciv.game.unit.AttackableEntity;
import me.rhin.openciv.game.unit.RangedUnit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.game.unit.UnitItem.UnitType;

public class Catapult extends UnitItem {

	public Catapult(City city) {
		super(city);
	}

	public static class CatapultUnit extends RangedUnit {

		public CatapultUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_CATAPULT);
		}

		@Override
		public int getRangedCombatStrength(AttackableEntity target) {
			if (target instanceof City) {
				// FIXME: Support floats.
				return (int) (7 * 1.35);
			}
			return 7;
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
	}

	@Override
	public String getName() {
		return "Catapult";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_CATAPULT;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return Civilization.getInstance().getGame().getPlayer().getResearchTree().hasResearched(MathematicsTech.class);
	}

	@Override
	public String getDesc() {
		return "One of the first ancient siege units. \n+35% Bonus damage towards cities.";
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.RANGED);
	}

	@Override
	protected float getUnitProductionCost() {
		return 75;
	}

}
