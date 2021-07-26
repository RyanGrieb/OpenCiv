package me.rhin.openciv.server.game.heritage.type.rome;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.heritage.Heritage;

public class LegionHeritage extends Heritage {

	public LegionHeritage(Player player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 0;
	}

	@Override
	public String getName() {
		return "Roman Legions";
	}

	@Override
	public float getCost() {
		return 20;
	}

	@Override
	protected void onStudied() {
		// TODO: Just remove swordsman and replace w/ legion
	}
}
