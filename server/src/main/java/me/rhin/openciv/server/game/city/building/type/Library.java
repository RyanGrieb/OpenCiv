package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.research.type.WritingTech;
import me.rhin.openciv.server.listener.CityGrowthListener;
import me.rhin.openciv.server.listener.CityStarveListener;
import me.rhin.openciv.shared.city.SpecialistType;
import me.rhin.openciv.shared.stat.Stat;

public class Library extends Building implements CityGrowthListener, CityStarveListener {

	public Library(City city) {
		super(city);

		this.statLine.addValue(Stat.SCIENCE_GAIN, 2);
		// TODO: Convey +1 science for every 2 citizens

		Server.getInstance().getEventManager().addListener(CityGrowthListener.class, this);
		Server.getInstance().getEventManager().addListener(CityStarveListener.class, this);
	}

	@Override
	public void create() {
		super.create();

		for (int i = 0; i < city.getStatLine().getStatValue(Stat.POPULATION); i++) {
			city.getStatLine().addValue(Stat.SCIENCE_GAIN, 0.5F);
		}
	}

	@Override
	public void onCityStarve(City city) {
		if (!city.getBuildings().contains(this))
			return;

		city.getStatLine().subValue(Stat.SCIENCE_GAIN, 0.5F);
		
	}
	@Override
	public void onCityGrowth(City city) {
		if (!city.getBuildings().contains(this))
			return;

		city.getStatLine().addValue(Stat.SCIENCE_GAIN, 0.5F);
	}

	@Override
	public float getBuildingProductionCost() {
		return 75;
	}
	
	@Override
	public float getGoldCost() {
		return 175;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(WritingTech.class);
	}

	@Override
	public int getSpecialistSlots() {
		return 1;
	}

	@Override
	public SpecialistType getSpecialistType() {
		return SpecialistType.SCIENTIST;
	}

	@Override
	public String getName() {
		return "Library";
	}
}
