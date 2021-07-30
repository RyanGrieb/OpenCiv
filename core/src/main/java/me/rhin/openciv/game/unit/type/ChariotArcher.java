package me.rhin.openciv.game.unit.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.WheelTech;
import me.rhin.openciv.game.unit.AttackableEntity;
import me.rhin.openciv.game.unit.RangedUnit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;

public class ChariotArcher extends UnitItem {

	public ChariotArcher(City city) {
		super(city);
	}

	public static class ChariotArcherUnit extends RangedUnit {

		public ChariotArcherUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_CHARIOT_ARCHER);
			this.canAttack = true;
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public int getCombatStrength(AttackableEntity targetEntity) {
			return 17;
		}

		@Override
		public int getRangedCombatStrength(AttackableEntity target) {
			return 10;
		}
	}

	@Override
	protected float getUnitProductionCost() {
		return 56;
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(WheelTech.class);
	}

	@Override
	public String getName() {
		return "Chariot Archer";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_CHARIOT_ARCHER;
	}

	@Override
	public String getDesc() {
		return "An ancient mounted ranged unit.";
	}

	@Override
	public UnitItemType getUnitItemType() {
		return UnitItemType.RANGED;
	}

}
