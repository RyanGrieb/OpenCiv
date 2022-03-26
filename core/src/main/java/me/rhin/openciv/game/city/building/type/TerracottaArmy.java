package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.wonders.Wonder;
import me.rhin.openciv.game.research.type.ConstructionTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class TerracottaArmy extends Building implements Wonder {

	public TerracottaArmy(City city) {
		super(city);
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(ConstructionTech.class)
				&& !Civilization.getInstance().getGame().getWonders().isBuilt(getClass());
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"A wonder of the Classical era, which creates a single copy of every unit \"type\" the player has on the map.",
				"+1 Heritage");
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_TERRACOTTA_ARMY;
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.HERITAGE_GAIN, 1);

		return statLine;
	}

	@Override
	public float getBuildingProductionCost() {
		return 200;
	}

	@Override
	public String getName() {
		return "Terracotta Army";
	}

}
