package me.rhin.openciv.server.game.heritage.type.mamluks;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.type.Bazaar;
import me.rhin.openciv.server.game.city.building.type.Market;
import me.rhin.openciv.server.game.heritage.Heritage;

public class BazaarHeritage extends Heritage {

	public BazaarHeritage(AbstractPlayer player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 2;
	}

	@Override
	public String getName() {
		return "Bazaars";
	}

	@Override
	public float getCost() {
		return 60;
	}

	@Override
	protected void onStudied() {

		// TODO: Maybe reference producible item manager to add buildings properly.

		for (City city : player.getOwnedCities()) {
			if (city.containsBuilding(Market.class)) {
				city.removeBuilding(Market.class);
				Bazaar bazaar = new Bazaar(city);
				bazaar.create();

				city.updateWorkedTiles();
			}
		}

		// FIXME: Needed? Referencing ProducibleItemManager when a building is
		// constructed.
		player.updateOwnedStatlines(false);
	}

}
