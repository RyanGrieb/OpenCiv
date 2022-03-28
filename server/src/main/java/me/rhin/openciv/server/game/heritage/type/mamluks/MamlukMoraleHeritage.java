package me.rhin.openciv.server.game.heritage.type.mamluks;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.stat.Stat;

public class MamlukMoraleHeritage extends Heritage implements Listener {

	public MamlukMoraleHeritage(AbstractPlayer player) {
		super(player);

		Server.getInstance().getEventManager().addListener(this);
	}

	@Override
	public int getLevel() {
		return 0;
	}

	@Override
	public String getName() {
		return "Mamluk Morale";
	}

	@Override
	public float getCost() {
		return 35;
	}

	@Override
	protected void onStudied() {
		for (Unit unit : player.getOwnedUnits()) {
			unit.getStatLineMap().get("health").addModifier(Stat.HEALTH_GAIN, 0.10F);
		}
	}

	@EventHandler
	public void onNewUnit(Unit unit) {

		if (!unit.getPlayerOwner().equals(player) || !studied)
			return;

		unit.getStatLineMap().get("health").addModifier(Stat.HEALTH_GAIN, 0.10F);
	}
}
