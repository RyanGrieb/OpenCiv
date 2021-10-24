package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.specialist.SpecialistContainer;
import me.rhin.openciv.game.research.type.WritingTech;
import me.rhin.openciv.shared.city.SpecialistType;
import me.rhin.openciv.shared.stat.Stat;

public class Library extends Building implements SpecialistContainer {

	public Library(City city) {
		super(city);

		this.statLine.addValue(Stat.SCIENCE_GAIN, 2);
		this.statLine.addValue(Stat.MAINTENANCE, 1);
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
		return Civilization.getInstance().getGame().getPlayer().getResearchTree().hasResearched(WritingTech.class);
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_LIBRARY;
	}

	@Override
	public String getName() {
		return "Library";
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
	public void addSpecialist(int amount) {

	}

	@Override
	public void removeSpecialist(int amount) {

	}

	@Override
	public String getDesc() {
		return "Provides +0.5 science for each\n citizen.\n+2 Science\n+0.5 Science for each citizen\n+1 Maintenance";
	}
}
