package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.religion.bonus.type.follower.PagodasBonus;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Pagoda extends Building {

	public Pagoda(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.HERITAGE_GAIN, 2);
		statLine.addValue(Stat.FAITH_GAIN, 2);
		statLine.addValue(Stat.MORALE_CITY, 10);

		return statLine;
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_PAGODA;
	}

	@Override
	public boolean meetsProductionRequirements() {
		if (city.getCityReligion().getMajorityReligion() == null)
			return false;

		return city.getCityReligion().getMajorityReligion().hasBonus(PagodasBonus.class);
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("Constructed in Asia, where the building provided storage to house sacred relics.",
				"+2 Heritage", "+2 Faith", "+10 Morale");
	}

	@Override
	public float getFaithCost() {
		return 200;
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public float getBuildingProductionCost() {
		return -1;
	}

	@Override
	public String getName() {
		return "Pagoda";
	}

}
