package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.game.unit.actions.type.FoundReligionAction;

public class Prophet extends UnitItem {

	public Prophet(City city) {
		super(city);
	}

	public static class ProphetUnit extends Unit {
		public ProphetUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_PROPHET);

			customActions.add(new FoundReligionAction(this));
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public boolean isUnitCapturable() {
			return true;
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.SUPPORT);
		}

		@Override
		public boolean canUpgrade() {
			return false;
		}
	}

	@Override
	protected float getUnitProductionCost() {
		return 80;
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}

	@Override
	public String getName() {
		return "Prophet";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_PROPHET;
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("Can found or improve an existing religion. Can also act as a missionary.");
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.SUPPORT);
	}

}
