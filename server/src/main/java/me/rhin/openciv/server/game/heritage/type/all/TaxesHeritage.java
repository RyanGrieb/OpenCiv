package me.rhin.openciv.server.game.heritage.type.all;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.server.game.heritage.IncreaseCityStatline;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class TaxesHeritage extends Heritage implements IncreaseCityStatline {

	public TaxesHeritage(AbstractPlayer player) {
		super(player);
	}

	@Override
	public StatLine getStatLine(City city) {
		StatLine statLine = new StatLine();
		statLine.addValue(Stat.GOLD_GAIN, 0.5F * city.getStatLine().getStatValue(Stat.POPULATION));

		return statLine;
	}

	@Override
	public int getLevel() {
		return 2;
	}

	@Override
	public String getName() {
		return "Taxes";
	}

	@Override
	public float getCost() {
		return 60;
	}

	@Override
	protected void onStudied() {
	}
}
