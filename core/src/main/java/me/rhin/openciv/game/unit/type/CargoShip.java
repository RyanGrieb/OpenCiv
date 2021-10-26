package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.SailingTech;
import me.rhin.openciv.game.unit.TradeUnit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.shared.stat.Stat;

public class CargoShip extends UnitItem {

	public CargoShip(City city) {
		super(city);
	}

	public static class CargoShipUnit extends TradeUnit {

		public CargoShipUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_CARGO_SHIP);
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (!tile.containsTileProperty(TileProperty.WATER) && !tile.containsTileType(TileType.CITY))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public float getMaxMovement() {
			return 1;
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.SUPPORT);
		}
	}

	@Override
	protected float getUnitProductionCost() {
		return 100;
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(SailingTech.class)
				&& city.getPlayerOwner().getStatLine().getStatValue(Stat.TRADE_ROUTE_AMOUNT) < city.getPlayerOwner()
						.getStatLine().getStatValue(Stat.MAX_TRADE_ROUTES);
	}

	@Override
	public String getName() {
		return "Cargo Ship";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_CARGO_SHIP;
	}

	@Override
	public String getDesc() {
		return "An classical era trade ship. \n+10 Gold each trade run. \n+10 Food each trade run.";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.SUPPORT);
	}
}
