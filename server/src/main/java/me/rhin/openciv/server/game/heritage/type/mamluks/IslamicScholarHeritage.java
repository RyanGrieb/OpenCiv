package me.rhin.openciv.server.game.heritage.type.mamluks;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.server.game.heritage.IncreaseCityStatline;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class IslamicScholarHeritage extends Heritage implements IncreaseCityStatline {

	public IslamicScholarHeritage(AbstractPlayer player) {
		super(player);
	}

	@Override
	public StatLine getStatLine(City city) {

		StatLine statLine = new StatLine();

		if (!city.isCapital())
			return statLine;

		float scienceValue = city.getStatLine().getStatValue(Stat.SCIENCE_GAIN) * 0.1F;
		statLine.addValue(Stat.SCIENCE_GAIN, scienceValue);

		return statLine;
	}

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Islamic Scholars";
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	protected void onStudied() {

	}
}
