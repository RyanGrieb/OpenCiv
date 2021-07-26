package me.rhin.openciv.server.game.heritage.type.all;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.heritage.Heritage;

public class StateWorshipHeritage extends Heritage {

	public StateWorshipHeritage(Player player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 0;
	}

	@Override
	public String getName() {
		return "State Worship";
	}

	@Override
	public float getCost() {
		return 20;
	}

	@Override
	protected void onStudied() {
		//Add monument to all cities`
	}

}
