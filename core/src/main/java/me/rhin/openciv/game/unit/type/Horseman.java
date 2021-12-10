package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.HorsebackRidingTech;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;

public class Horseman extends UnitItem {

	public Horseman(City city) {
		super(city);
	}

	public static class HorsemanUnit extends Unit {
		public HorsemanUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_HORSEMAN);
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public float getMaxMovement() {
			return 3;
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.MELEE, UnitType.MOUNTED);
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
		boolean requiredTile = false;

		for (Tile tile : city.getTerritory())
			if (tile.containsTileType(TileType.HORSES_IMPROVED))
				requiredTile = true;

		return city.getPlayerOwner().getResearchTree().hasResearched(HorsebackRidingTech.class) && requiredTile;
	}

	@Override
	public String getName() {
		return "Horseman";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_HORSEMAN;
	}

	@Override
	public String getDesc() {
		return "A powerful classical era unit.\nRequires the city to contain\nimproved horses.";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.MELEE, UnitType.MOUNTED);
	}
}