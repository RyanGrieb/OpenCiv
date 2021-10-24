package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.game.research.type.PotteryTech;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitItem.UnitType;
import me.rhin.openciv.shared.stat.Stat;

public class Shrine extends Building {

	public Shrine(City city) {
		super(city);

		this.statLine.addValue(Stat.HERITAGE_GAIN, 1);
		this.statLine.addValue(Stat.MAINTENANCE, 1);
	}

	@Override
	public void onBuilt() {
		super.onBuilt();

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

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_SHRINE;
	}

	@Override
	public String getDesc() {
		return "A sanctuary for normal citizens. \n10% produciton bonus towards \nsupport units. Support units \ninclude builders & settlers. \n+1 Heritage";
	}
}
