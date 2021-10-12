package me.rhin.openciv.server.game.heritage.type.rome;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.heritage.Heritage;

public class DefensiveLogisticsHeritage extends Heritage {

	public DefensiveLogisticsHeritage(AbstractPlayer player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Defensive Logistics";
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	protected void onStudied() {

	}
}
