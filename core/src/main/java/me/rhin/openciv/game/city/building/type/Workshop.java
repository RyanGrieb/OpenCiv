package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.research.type.MetalCastingTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Workshop extends Building {

	public Workshop(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.MAINTENANCE, 2);
		statLine.addValue(Stat.PRODUCTION_GAIN, 2);
		return statLine;
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_WORKSHOP;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(MetalCastingTech.class);
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("Improves the production in the city", "+2 Production", "+10% Production Output",
				"+2 Maintenance");
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public float getBuildingProductionCost() {
		return 120;
	}

	@Override
	public String getName() {
		return "Workshop";
	}

}
