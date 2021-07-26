package me.rhin.openciv.server.game.heritage.type.germany;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.heritage.Heritage;

public class DisciplineHeritage extends Heritage {

	public DisciplineHeritage(Player player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Military Discipline";
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	protected void onStudied() {
	}
}
