package me.rhin.openciv.server.game.heritage.type.all;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.server.listener.CityGrowthListener;
import me.rhin.openciv.server.listener.CityStarveListener;
import me.rhin.openciv.shared.stat.Stat;

public class TaxesHeritage extends Heritage implements CityGrowthListener, CityStarveListener {

	public TaxesHeritage(AbstractPlayer player) {
		super(player);

		Server.getInstance().getEventManager().addListener(CityGrowthListener.class, this);
		Server.getInstance().getEventManager().addListener(CityStarveListener.class, this);
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
		for (City city : player.getOwnedCities())
			for (int i = 0; i < city.getStatLine().getStatValue(Stat.POPULATION); i++) {
				city.getStatLine().addValue(Stat.GOLD_GAIN, 0.5F);
			}
	}

	@Override
	public void onCityStarve(City city) {
		if (!isStudied() || !player.getOwnedCities().contains(city))
			return;

		city.getStatLine().subValue(Stat.GOLD_GAIN, 0.5F);
	}

	@Override
	public void onCityGrowth(City city) {
		if (!isStudied() || !player.getOwnedCities().contains(city))
			return;

		city.getStatLine().addValue(Stat.GOLD_GAIN, 0.5F);
	}

}
