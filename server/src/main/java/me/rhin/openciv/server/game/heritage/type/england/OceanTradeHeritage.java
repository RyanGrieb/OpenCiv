package me.rhin.openciv.server.game.heritage.type.england;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.heritage.Heritage;

public class OceanTradeHeritage extends Heritage {

	public OceanTradeHeritage(AbstractPlayer player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Ocean Trade";
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	protected void onStudied() {

	}
}
