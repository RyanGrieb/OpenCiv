package me.rhin.openciv.server.game.heritage.type.germany;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.heritage.Heritage;

public class BarbarianHeritage extends Heritage {

	public BarbarianHeritage(Player player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 0;
	}

	@Override
	public String getName() {
		return "Barbarian Heritage";
	}

	@Override
	public float getCost() {
		return 20;
	}

	@Override
	protected void onStudied() {
	}
}
