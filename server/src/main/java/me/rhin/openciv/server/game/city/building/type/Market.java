package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.heritage.type.mamluks.BazaarHeritage;
import me.rhin.openciv.server.game.research.type.CurrencyTech;
import me.rhin.openciv.shared.city.SpecialistType;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Market extends Building {

	public Market(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.GOLD_GAIN, 2);
		statLine.addModifier(Stat.GOLD_GAIN, 0.25F);

		return statLine;
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
	public boolean meetsProductionRequirements() {

		if (city.getPlayerOwner().getHeritageTree().hasStudied(BazaarHeritage.class))
			return false;

		return city.getPlayerOwner().getResearchTree().hasResearched(CurrencyTech.class);
	}

	@Override
	public int getSpecialistSlots() {
		return 1;
	}

	@Override
	public SpecialistType getSpecialistType() {
		return SpecialistType.MERCHANT;
	}

	@Override
	public String getName() {
		return "Market";
	}
}
