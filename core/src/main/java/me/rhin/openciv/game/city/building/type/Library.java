package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.specialist.SpecialistContainer;
import me.rhin.openciv.game.research.type.WritingTech;
import me.rhin.openciv.shared.city.SpecialistType;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Library extends Building implements SpecialistContainer {

	public Library(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.SCIENCE_GAIN, 2);
		statLine.addValue(Stat.MAINTENANCE, 1);

		return statLine;
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
	public List<String> getDesc() {
		return Arrays.asList("An ancient era science building.", "+0.5 Science for each citizen", "+2 Science",
				"+1 Maintenance");
	}
}
