package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.heritage.type.mamluks.BazaarHeritage;
import me.rhin.openciv.server.game.research.type.CurrencyTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Bazaar extends Building {

	public Bazaar(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.GOLD_GAIN, 2);
		statLine.addValue(Stat.SCIENCE_GAIN, 2);
		statLine.addModifier(Stat.GOLD_GAIN, 0.25F);

		return statLine;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getHeritageTree().hasStudied(BazaarHeritage.class)
				&& city.getPlayerOwner().getResearchTree().hasResearched(CurrencyTech.class);
	}

	@Override
	public float getBuildingProductionCost() {
		return 100;
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public String getName() {
		return "Bazaar";
	}

}
