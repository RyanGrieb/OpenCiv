package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.wonders.Wonder;
import me.rhin.openciv.game.research.type.MathematicsTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class HangingGardens extends Building implements Wonder {

	public HangingGardens(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.FOOD_GAIN, 10);
		statLine.addValue(Stat.HERITAGE_GAIN, 1);

		return statLine;
	}

	@Override
	public float getBuildingProductionCost() {
		return 250;
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return Civilization.getInstance().getGame().getPlayer().getResearchTree().hasResearched(MathematicsTech.class);
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_HANGING_GARDENS;
	}

	@Override
	public String getName() {
		return "Hanging Gardens";
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"The Hanging Gardens of Babylon were one of the Server Wonders of the Ancient World listed by Hellenic culture.",
				"+10 Food", "+1 Heritage");
	}
}
