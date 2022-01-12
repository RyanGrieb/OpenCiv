package me.rhin.openciv.server.game.civilization.type;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.civilization.Civ;

public class RandomCivilization extends Civ {

	public RandomCivilization(AbstractPlayer player) {
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
