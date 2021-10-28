package me.rhin.openciv.server.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.research.type.AnimalHusbandryTech;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.TraderUnit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.shared.stat.Stat;

public class Caravan extends UnitItem {

	public Caravan(City city) {
		super(city);
	}

	public static class CaravanUnit extends TraderUnit {

		public CaravanUnit(AbstractPlayer playerOwner, Tile standingTile) {
			super(playerOwner, standingTile, 5, 5);
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}


		@Override
		public boolean isUnitCapturable(AttackableEntity attackingEntity) {
			return true;
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.SUPPORT);
		}

		@Override
		public String getName() {
			return "Caravan";
		}
	}

	@Override
	public float getUnitProductionCost() {
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
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.SUPPORT);
	}

	@Override
	public float getBaseCombatStrength() {
		return 0;
	}
}
