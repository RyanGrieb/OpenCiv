package me.rhin.openciv.server.game.ai.unit;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.NextTurnListener;

public class CityStateNavalAI extends UnitAI implements NextTurnListener {

	private Tile targetTile;

	public CityStateNavalAI(Unit unit) {
		super(unit);
		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {
		moveUnit();
	}

	@Override
	public void clearListeners() {
		Server.getInstance().getEventManager().removeListener(NextTurnListener.class, this);
	}

	private void moveUnit() {
		if (!unit.isAlive())
			return;

		if (targetTile != null && targetTile.equals(unit.getStandingTile()))
			targetTile = null;

		if (targetTile == null)
			findTargets();

		moveToTarget();
	}

	private void moveToTarget() {
	}

	private void findTargets() {
		
		//TODO: Use barbarian AI to explore the water.
		//doRandomTarget();
	}
}
