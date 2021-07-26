package me.rhin.openciv.server.game.civilization.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.civilization.Civ;
import me.rhin.openciv.server.game.heritage.type.england.LineShipHeritage;
import me.rhin.openciv.server.game.heritage.type.england.OceanTradeHeritage;
import me.rhin.openciv.server.game.heritage.type.england.SailingHeritage;
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
	}

	@Override
	public String getName() {
		return "Germany";
	}

	@Override
	public void initHeritage() {
		addHeritage(new BarbarianHeritage(player));
		addHeritage(new BlitzkriegHeritage(player));
		addHeritage(new DisciplineHeritage(player));
	}
}
