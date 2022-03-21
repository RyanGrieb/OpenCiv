package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.heritage.type.mamluks.BazaarHeritage;
import me.rhin.openciv.game.research.type.CurrencyTech;
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

		return statLine;
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_BAZAAR;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getHeritageTree().hasStudied(BazaarHeritage.class)
				&& city.getPlayerOwner().getResearchTree().hasResearched(CurrencyTech.class);
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("A unique market building for the Mamluks.", "+2 Science", "+2 Gold",
				"+25% Gold Production");
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
