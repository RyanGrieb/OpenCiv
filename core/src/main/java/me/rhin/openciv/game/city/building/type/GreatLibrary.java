package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.specialist.SpecialistContainer;
import me.rhin.openciv.game.city.wonders.Wonder;
import me.rhin.openciv.game.research.type.WritingTech;
import me.rhin.openciv.shared.city.SpecialistType;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class GreatLibrary extends Building implements SpecialistContainer, Wonder {

	public GreatLibrary(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.SCIENCE_GAIN, 3);
		statLine.addValue(Stat.HERITAGE_GAIN, 1);

		return statLine;
	}

	@Override
	public float getBuildingProductionCost() {
		return 185;
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return Civilization.getInstance().getGame().getPlayer().getResearchTree().hasResearched(WritingTech.class)
				&& !Civilization.getInstance().getGame().getWonders().isBuilt(getClass());
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_GREAT_LIBRARY;
	}

	@Override
	public String getName() {
		return "Great Library";
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
		return Arrays.asList("A great ancient wonder for a technology boost.", "+3 Science", "+1 Heritage",
				"+10% Science Production");
	}
}