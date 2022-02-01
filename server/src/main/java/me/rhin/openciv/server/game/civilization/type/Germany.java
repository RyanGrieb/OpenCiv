package me.rhin.openciv.server.game.civilization.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.civilization.Civ;
import me.rhin.openciv.server.game.heritage.type.germany.BarbarianHeritage;
import me.rhin.openciv.server.game.heritage.type.germany.BlitzkriegHeritage;
import me.rhin.openciv.server.game.heritage.type.germany.DisciplineHeritage;
import me.rhin.openciv.server.game.unit.Unit;

public class Germany extends Civ {

	/*
	 * Germany 10% Production to military units, All military units have +1 movement
	 * speed, Panzer Unit. Capture Barbarian units.
	 */
	public Germany(AbstractPlayer player) {
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

	@Override
	public boolean canCaptureUnit(Unit unit) {

		if (!player.getHeritageTree().hasStudied(BarbarianHeritage.class))
			return false;

		return (unit.getPlayerOwner().getCiv() instanceof Barbarians && unit.getHealth() < 40
				&& Server.getInstance().getInGameState().getCurrentTurn() % 2 == 0);
	}
}
