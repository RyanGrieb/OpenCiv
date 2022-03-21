package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.wonders.Wonder;
import me.rhin.openciv.game.research.type.MasonryTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class GreatPyramids extends Building implements Wonder {

	public GreatPyramids(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.HERITAGE_GAIN, 1);

		return statLine;
	}

	@Override
	public String getName() {
		return "Great Pyramids";
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
		return city.getPlayerOwner().getResearchTree().hasResearched(MasonryTech.class)
				&& !Civilization.getInstance().getGame().getWonders().isBuilt(getClass());
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_PYRAMIDS;
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("A great ancient wonder for improving tiles rapidly. Gives two builders once constructed.",
				"+1 Heritage");
	}
}
