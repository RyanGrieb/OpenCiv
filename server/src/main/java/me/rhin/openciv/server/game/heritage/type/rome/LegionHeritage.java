package me.rhin.openciv.server.game.heritage.type.rome;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.heritage.Heritage;

public class LegionHeritage extends Heritage {

	public LegionHeritage(AbstractPlayer player) {
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
