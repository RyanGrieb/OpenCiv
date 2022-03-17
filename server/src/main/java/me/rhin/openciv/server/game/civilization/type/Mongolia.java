package me.rhin.openciv.server.game.civilization.type;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.civilization.Civ;
import me.rhin.openciv.server.game.heritage.type.mongolia.HorseIntegrationHeritage;

public class Mongolia extends Civ {

	public Mongolia(AbstractPlayer player) {
		super(player);
	}

	@Override
	public String getName() {
		return "Mongolia";
	}

	@Override
	public void initHeritage() {
		addHeritage(new HorseIntegrationHeritage(player));
	}

}
