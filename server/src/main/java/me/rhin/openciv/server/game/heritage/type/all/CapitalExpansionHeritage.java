package me.rhin.openciv.server.game.heritage.type.all;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.server.game.heritage.IncreaseCityStatline;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class CapitalExpansionHeritage extends Heritage implements IncreaseCityStatline {

	public CapitalExpansionHeritage(AbstractPlayer player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Capital Expansion";
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	protected void onStudied() {
	}

	@Override
	public StatLine getStatLine(City city) {
		StatLine statLine = new StatLine();
		statLine.addModifier(Stat.FOOD_GAIN, 0.15F);
		return statLine;
	}
}
