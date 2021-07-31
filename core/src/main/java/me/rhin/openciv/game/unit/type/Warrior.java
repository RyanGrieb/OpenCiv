package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.unit.AttackableEntity;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.game.unit.UnitItem.UnitType;

public class Warrior extends UnitItem {

	public Warrior(City city) {
		super(city);
	}

	public static class WarriorUnit extends Unit {

		public WarriorUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_WARRIOR);
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
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.MELEE);
		}
	}

	@Override
	protected float getUnitProductionCost() {
		return 40;
	}

	@Override
	public float getGoldCost() {
		return 100;
	}
	
	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}

	@Override
	public String getName() {
		return "Warrior";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_WARRIOR;
	}
	
	@Override
	public String getDesc() {
		return "An ancient melee unit.";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.MELEE);
	}
}
