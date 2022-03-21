package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.AnimalHusbandryTech;
import me.rhin.openciv.game.unit.TradeUnit;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.shared.stat.Stat;

public class Caravan extends UnitItem {

	public Caravan(City city) {
		super(city);
	}

	public static class CaravanUnit extends TradeUnit {

		public CaravanUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_CARAVAN);
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
			return 1;
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
		return 75;
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(AnimalHusbandryTech.class)
				&& city.getPlayerOwner().getStatLine().getStatValue(Stat.TRADE_ROUTE_AMOUNT) < city.getPlayerOwner()
						.getStatLine().getStatValue(Stat.MAX_TRADE_ROUTES);
	}

	@Override
	public String getName() {
		return "Caravan";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_CARAVAN;
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("An ancient trader unit.", "+5 Gold every route complete",
				"+5 Food every route complete.");
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.SUPPORT);
	}
}
