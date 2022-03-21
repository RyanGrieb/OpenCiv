package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.research.type.TrappingTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Circus extends Building {

	public Circus(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.MORALE_CITY, 10);

		return statLine;
	}

	@Override
	public float getBuildingProductionCost() {
		return 80;
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public String getName() {
		return "Circus";
	}

	@Override
	public boolean meetsProductionRequirements() {
		return Civilization.getInstance().getGame().getPlayer().getResearchTree().hasResearched(TrappingTech.class);
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_CIRCUS;
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"Basic happiness-enhancing building of the Ancient Era. Requires an improved source of Horses or Ivory nearby.",
				"+10 Morale");
	}

}
