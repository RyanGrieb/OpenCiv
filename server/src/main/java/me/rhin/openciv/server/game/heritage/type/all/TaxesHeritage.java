package me.rhin.openciv.server.game.heritage.type.all;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.heritage.Heritage;

public class TaxesHeritage extends Heritage {

	public TaxesHeritage(Player player) {
		super(player);
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
		//Look at library building
	}

}
