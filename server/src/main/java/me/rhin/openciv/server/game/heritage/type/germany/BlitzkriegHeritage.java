package me.rhin.openciv.server.game.heritage.type.germany;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.heritage.Heritage;

public class BlitzkriegHeritage extends Heritage {

	public BlitzkriegHeritage(Player player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 2;
	}

	@Override
	public String getName() {
		return "Blitzkrieg";
	}
	
	@Override
	public float getCost() {
		return 60;
	}
	
	@Override
	protected void onStudied() {
	}
}
