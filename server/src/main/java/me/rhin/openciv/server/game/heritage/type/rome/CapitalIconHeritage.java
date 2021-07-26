package me.rhin.openciv.server.game.heritage.type.rome;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.heritage.Heritage;

public class CapitalIconHeritage extends Heritage {

	public CapitalIconHeritage(Player player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Capital Icon";
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	protected void onStudied() {
		// Modify production manager in other cities than the captial to refrence the
		// captials built buildings
	}
}
