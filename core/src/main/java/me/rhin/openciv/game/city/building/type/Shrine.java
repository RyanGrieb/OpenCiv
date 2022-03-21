package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.game.research.type.PotteryTech;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitItem.UnitType;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Shrine extends Building {

	public Shrine(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.HERITAGE_GAIN, 1);
		statLine.addValue(Stat.MAINTENANCE, 1);

		return statLine;
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
	public List<String> getDesc() {
		return Arrays.asList("A sanctuary for all citizens.",
				"+10% Production towards support units. Support units include builders & settlers.", "+1 Heritage");
	}
}
