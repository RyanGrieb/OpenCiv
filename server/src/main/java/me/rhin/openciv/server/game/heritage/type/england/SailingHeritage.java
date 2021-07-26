package me.rhin.openciv.server.game.heritage.type.england;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.heritage.Heritage;

public class SailingHeritage extends Heritage {

	public SailingHeritage(Player player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 0;
	}

	@Override
	public String getName() {
		return "Ocean Superiority";
	}

	@Override
	public float getCost() {
		return 20;
	}

	@Override
	protected void onStudied() {

	}
}
