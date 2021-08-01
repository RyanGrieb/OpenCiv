package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.server.game.research.type.PotteryTech;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;
import me.rhin.openciv.shared.stat.Stat;

public class Shrine extends Building {

	public Shrine(City city) {
		super(city);

		this.statLine.addValue(Stat.HERITAGE_GAIN, 1);
	}

	@Override
	public void create() {
		super.create();

		for (ProductionItem item : city.getProducibleItemManager().getPossibleItems().values()) {
			if (item instanceof UnitItem) {
				UnitItem unitItem = (UnitItem) item;
				if (unitItem.getUnitItemTypes().contains(UnitType.SUPPORT)) {
					item.setProductionModifier(-0.1F);
				}
			}
		}
	}

	@Override
	public float getBuildingProductionCost() {
		return 65;
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public String getName() {
		return "Shrine";
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(PotteryTech.class);
	}
}
