package me.rhin.openciv.server.game.heritage.type.all;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.shared.stat.Stat;

public class CapitalExpansionHeritage extends Heritage {

	public CapitalExpansionHeritage(Player player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Capital Expansion";
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	protected void onStudied() {
		// Set capital city stat value
		player.getOwnedCities().get(0).getStatLine().addModifier(Stat.FOOD_GAIN, 0.15F);
	}
}
