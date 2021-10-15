package me.rhin.openciv.server.game.ai.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.AIPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.civilization.type.citystate.CityState;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Settler;
import me.rhin.openciv.server.game.unit.type.Settler.SettlerUnit;
import me.rhin.openciv.server.listener.NextTurnListener;

public class CityStatePlayer extends AIPlayer implements NextTurnListener {

	public enum CityStateType {
		GOLD,
		PRODUCTION,
		SCIENCE;
	}

	private String name;

	public CityStatePlayer(CityStateType cityStateType) {
		this.name = City.getRandomCityName();

		this.civilization = new CityState(this, cityStateType);

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {

		if (Server.getInstance().getInGameState().getCurrentTurn() == 1)
			settleInitalCity();
	}

	@Override
	public String getName() {
		return name;
	}

	@Override
	public void sendPacket(String json) {
		//
	}

	@Override
	public boolean hasConnection() {
		return true;
	}

	private void settleInitalCity() {
		for (Unit unit : ownedUnits) {
			if (unit instanceof SettlerUnit) {
				((SettlerUnit) unit).settleCity();
			}
		}
	}
}
