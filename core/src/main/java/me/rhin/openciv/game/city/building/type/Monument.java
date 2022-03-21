package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Monument extends Building {

	public Monument(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.HERITAGE_GAIN, 2);
		statLine.addValue(Stat.MAINTENANCE, 1);

		return statLine;
	}

	@Override
	public float getBuildingProductionCost() {
		return 40;
	}

	@Override
	public float getGoldCost() {
		return 100;
	}

	@Override
	public String getName() {
		return "Monument";
	}

	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_MONUMENT;
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("Basic culture building of the Ancient Era, improving territory growth early.",
				"+2 Heritage", "+1 Maintenance");
	}

}
