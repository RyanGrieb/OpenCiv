package me.rhin.openciv.server.game.ai.unit;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.server.listener.ServerSettleCityListener;

public class CitySateRangedAI extends UnitAI implements NextTurnListener, ServerSettleCityListener {

	private City city;
	private Tile targetTile;

	public CitySateRangedAI(Unit unit) {
		super(unit);

		if (unit.getPlayerOwner().getOwnedCities().size() > 0)
			this.city = unit.getPlayerOwner().getCapitalCity();

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Server.getInstance().getEventManager().addListener(ServerSettleCityListener.class, this);
	}

	@Override
	public void onSettleCity(City city) {
		this.city = city;
	}

	@Override
	public void onNextTurn() {
		moveUnit();
	}

	@Override
	public void clearListeners() {
		Server.getInstance().getEventManager().removeListener(NextTurnListener.class, this);
		Server.getInstance().getEventManager().removeListener(ServerSettleCityListener.class, this);
	}

	private void moveUnit() {
		if (!unit.isAlive())
			return;
		
		if (targetTile != null && targetTile.equals(unit.getStandingTile()))
			targetTile = null;

		// If we were attacking,
		if (unit.getHealth() <= 60 && !unit.getTile().equals(city.getOriginTile())) {
			targetTile = null;
		}

		if (targetTile == null)
			findTargets();

		//moveToTarget();
	}

	private void findTargets() {
		
	}
}
