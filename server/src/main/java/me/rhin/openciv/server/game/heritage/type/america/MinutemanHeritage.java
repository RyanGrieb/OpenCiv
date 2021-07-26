package me.rhin.openciv.server.game.heritage.type.america;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.heritage.Heritage;

public class MinutemanHeritage extends Heritage {

	public MinutemanHeritage(Player player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 2;
	}

	@Override
	public String getName() {
		return "Minuteman";
	}

	@Override
	public float getCost() {
		return 60;
	}

	@Override
	protected void onStudied() {
		//TODO: Implement musketmen first
	}
}
