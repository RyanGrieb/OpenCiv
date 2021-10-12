package me.rhin.openciv.server.game.civilization.type;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.civilization.Civ;
import me.rhin.openciv.server.game.heritage.type.rome.CapitalIconHeritage;
import me.rhin.openciv.server.game.heritage.type.rome.DefensiveLogisticsHeritage;
import me.rhin.openciv.server.game.heritage.type.rome.LegionHeritage;

public class Rome extends Civ {

	/*
	 * Rome 25% Production to existing buildings in the capital, Builders can
	 * produce forts immediately, Legion Unit
	 */

	public Rome(AbstractPlayer player) {
		super(player);
	}

	@Override
	public String getName() {
		return "Rome";
	}

	@Override
	public void initHeritage() {
		addHeritage(new LegionHeritage(player));
		addHeritage(new CapitalIconHeritage(player));
		addHeritage(new DefensiveLogisticsHeritage(player));
	}
}
