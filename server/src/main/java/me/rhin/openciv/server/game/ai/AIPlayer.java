package me.rhin.openciv.server.game.ai;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.unit.Unit;

public abstract class AIPlayer extends AbstractPlayer {

	@Override
	public boolean hasConnection() {
		// Always true since we an AI
		return true;
	}

	// Methods we don't use
	@Override
	public void setSelectedUnit(Unit unit) {
	}

	@Override
	public void sendPacket(String json) {
		// Don't send anything since were an AI.
	}
}
