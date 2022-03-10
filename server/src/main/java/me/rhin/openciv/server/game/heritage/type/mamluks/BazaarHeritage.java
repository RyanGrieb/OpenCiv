package me.rhin.openciv.server.game.heritage.type.mamluks;

import me.rhin.openciv.server.game.AbstractPlayer;
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
	}

}
