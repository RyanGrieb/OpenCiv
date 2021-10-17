package me.rhin.openciv.server.game.ai.type;

import java.util.ArrayList;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.AIPlayer;
import me.rhin.openciv.server.game.ai.unit.CityStateCombatUnitAI;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.civilization.type.citystate.CityState;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.production.ProducibleItemManager;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.server.game.research.Technology;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;
import me.rhin.openciv.server.game.unit.type.Settler;
import me.rhin.openciv.server.game.unit.type.Settler.SettlerUnit;
import me.rhin.openciv.server.game.unit.type.Warrior.WarriorUnit;
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
	public void addOwnedUnit(Unit unit) {
		ownedUnits.add(unit);

		if (unit instanceof WarriorUnit) {
			unit.addAIBehavior(new CityStateCombatUnitAI(unit));
		}
	}

	@Override
	public void onNextTurn() {

		if (Server.getInstance().getInGameState().getCurrentTurn() == 1) {
			settleInitialCity();
		}

		modifyIntimidation();
		progressResearch();
		choseProduction();
	}

	@Override
	public String getName() {
		return name;
	}

	@Override
	public void sendPacket(String json) {
		//
	}

	private void modifyIntimidation() {
		ArrayList<Tile> borderTiles = new ArrayList<>();

		for (City city : ownedCities)
			for (Tile tile : city.getTerritory())
				for (Tile adjTile : tile.getAdjTiles())
					if (!borderTiles.contains(adjTile))
						borderTiles.add(adjTile);

		for (Unit unit : ownedUnits)
			for (Tile adjTile : unit.getStandingTile().getAdjTiles())
				if (!borderTiles.contains(adjTile))
					borderTiles.add(adjTile);

		int enemyUnitAmount = 0;
		for (Tile tile : borderTiles)
			for (Unit unit : tile.getUnits())
				if (!unit.getPlayerOwner().equals(this))
					enemyUnitAmount++;

		int combatUnitAmount = 0;
		for (Unit unit : ownedUnits)
			if (unit.getUnitTypes().contains(UnitType.MELEE) || unit.getUnitTypes().contains(UnitType.RANGED)
					|| unit.getUnitTypes().contains(UnitType.MOUNTED))
				combatUnitAmount++;

		// Avoid /zero
		if (combatUnitAmount < 1)
			combatUnitAmount = 1;

		intimidation = (enemyUnitAmount / combatUnitAmount) * 80;
	}

	private void progressResearch() {
		if (researchTree.getTechResearching() != null)
			return;

		ArrayList<Technology> availableTechs = new ArrayList<>();
		for (Technology tech : researchTree.getTechnologies()) {
			if (tech.canResearch())
				availableTechs.add(tech);
		}

		// Choose top tech based on order of ResearchProperties.
		float techValue = 0;
		Technology topTech = null;
		for (Technology tech : availableTechs) {
			float currentValue = tech.getTechValue();
			if (techValue < currentValue) {
				techValue = currentValue;
				topTech = tech;
			}
		}

		if (topTech == null) {
			System.out.println("FIXME: No techs with properties.");
			return;
		}

		// System.out.println("Tech Choose:" + topTech.getName());
		researchTree.chooseTech(topTech);
	}

	private void choseProduction() {
		for (City city : ownedCities) {

			ProducibleItemManager itemManager = city.getProducibleItemManager();

			// Produce units to fight intimidation.
			if (intimidation > 70) {

				boolean producingMilitaryUnit = false;
				if (itemManager.getProducingItem() != null
						&& itemManager.getProducingItem().getProductionItem() instanceof UnitItem) {
					UnitItem unitItem = (UnitItem) itemManager.getProducingItem().getProductionItem();
					if (unitItem.getBaseCombatStrength() > 0)
						producingMilitaryUnit = true;
				}

				if (!producingMilitaryUnit)
					itemManager.clearProducingItem();
			}

			if (itemManager.isProducingItem())
				return;

			ProductionItem topItem = null;
			for (ProductionItem productionItem : itemManager.getProducibleItems()) {
				if (productionItem instanceof Settler || productionItem.isWonder())
					continue;

				// System.out.println(productionItem.getName() + "-" +
				// productionItem.getAIValue(this));

				if (topItem == null || topItem.getAIValue(this) < productionItem.getAIValue(this))
					topItem = productionItem;
			}

			// System.out.println("Citystate " + name + " producing: " + topItem.getName());
			itemManager.setProducingItem(topItem.getName());
		}
	}

	private void settleInitialCity() {
		for (Unit unit : ownedUnits) {
			if (unit instanceof SettlerUnit) {
				((SettlerUnit) unit).settleCity(name);
			}
		}
	}
}
