package me.rhin.openciv.server.game.civilization.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.civilization.Civ;

public class RandomCivilization extends Civ {

	public RandomCivilization(Player player) {
		super(player);
	}

	@Override
	public String getName() {
		return "Random";
	}

	@Override
	public void initHeritage() {
	}

}
