package me.rhin.openciv.server.game.civilization.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.civilization.Civ;
import me.rhin.openciv.server.game.heritage.type.germany.BarbarianHeritage;
import me.rhin.openciv.server.game.heritage.type.germany.BlitzkriegHeritage;
import me.rhin.openciv.server.game.heritage.type.germany.DisciplineHeritage;

public class Germany extends Civ {

	/*
	 * Germany 10% Production to military units, All military units have +1 movement
	 * speed, Panzer Unit. Capture Barbarian units.
	 */
	public Germany(Player player) {
		super(player);

		addHeritage(new BarbarianHeritage(player));
		addHeritage(new BlitzkriegHeritage(player));
		addHeritage(new DisciplineHeritage(player));
	}

	@Override
	public String getName() {
		return "Germany";
	}
}
