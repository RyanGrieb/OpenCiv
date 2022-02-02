package me.rhin.openciv.server.game.ai;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.FallbackNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.unit.Unit;

public class AIPlayer extends AbstractPlayer {

	private FallbackNode mainNode;
	private String name;

	public AIPlayer(AIType aiType) {

		mainNode = new FallbackNode("Main Node");
		aiType.initBehaviorTree(mainNode, this);
	}

	@Override
	public void onNextTurn() {
		super.onNextTurn();

		mainNode.tick();
	}

	public void addCity(City city) {
		super.addCity(city);
		city.addAIBehavior(new CityAI(city, AIType.CITY));
	}

	@Override
	public boolean hasConnection() {
		// Always true since we an AI
		return true;
	}

	@Override
	public void setSelectedUnit(Unit unit) {
		// Methods we don't use
	}

	@Override
	public void sendPacket(String json) {
		// Don't send anything since were an AI.
	}

	@Override
	public boolean isLoaded() {
		return true;
	}

	@Override
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}
}
