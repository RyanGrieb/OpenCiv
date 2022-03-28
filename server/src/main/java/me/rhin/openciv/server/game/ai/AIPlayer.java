package me.rhin.openciv.server.game.ai;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.FallbackNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;
import me.rhin.openciv.server.game.unit.type.Builder.BuilderUnit;
import me.rhin.openciv.server.game.unit.type.Settler.SettlerUnit;
import me.rhin.openciv.shared.listener.EventHandler;

public class AIPlayer extends AbstractPlayer {

	private AIType aiType;
	private FallbackNode mainNode;
	private String name;

	public AIPlayer(AIType aiType) {

		this.aiType = aiType;
		mainNode = new FallbackNode("Main Node");
		aiType.initBehaviorTree(mainNode, this);
	}

	@EventHandler
	public void onNextTurn() {
		super.onNextTurn();

		mainNode.tick();
	}

	@Override
	public void addCity(City city) {
		super.addCity(city);
		city.addAIBehavior(new CityAI(city, AIType.CITY));
	}

	@Override
	public void addOwnedUnit(Unit unit) {
		super.addOwnedUnit(unit);

		// FIXME: In the future were going to have to do this better.

		if (unit instanceof BuilderUnit) {
			unit.addAIBehavior(new UnitAI(unit, AIType.BUILDER_UNIT));
			return;
		}

		if (unit instanceof SettlerUnit) {
			unit.addAIBehavior(new UnitAI(unit, AIType.SETTLER_UNIT));
			return;
		}

		// FIXME: Account for barbarian AI better.
		if (aiType == AIType.BARBARIAN_PLAYER) {
			unit.addAIBehavior(new UnitAI(unit, AIType.BARBARIAN_MELEE_UNIT));
			return;
		}

		if (unit.getUnitTypes().contains(UnitType.NAVAL)) {
			// TODO: Implement naval ai
		} else {
			for (UnitType unitType : unit.getUnitTypes()) {

				switch (unitType) {
				case MELEE:
				case MOUNTED:
					unit.addAIBehavior(new UnitAI(unit, AIType.LAND_MELEE_UNIT));
					break;
				case RANGED:
					unit.addAIBehavior(new UnitAI(unit, AIType.LAND_RANGED_UNIT));
					break;
				default:
					break;
				}
			}
		}
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
	public void sendNotification(String iconName, String text) {
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

	public AIType getAIType() {
		return aiType;
	}
}
