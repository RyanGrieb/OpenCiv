package me.rhin.openciv.server.game;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.civilization.Civ;
import me.rhin.openciv.server.game.civilization.CivType;
import me.rhin.openciv.server.game.heritage.HeritageTree;
import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.shared.stat.StatType;

public abstract class AbstractPlayer {

	protected ArrayList<City> ownedCities;
	protected ArrayList<Unit> ownedUnits;
	protected StatLine statLine;
	protected ResearchTree researchTree;
	protected HeritageTree heritageTree;
	protected Civ civilization;

	public AbstractPlayer() {

		this.ownedCities = new ArrayList<>();
		this.ownedUnits = new ArrayList<>();

		this.statLine = new StatLine();

		this.researchTree = new ResearchTree(this);
		this.heritageTree = new HeritageTree(this);
	}

	public abstract String getName();
	public abstract void sendPacket(String json);

	public void updateOwnedStatlines(boolean increaseValues) {

		// Clear previous values other than accumulative ones.
		statLine.clearNonAccumulative();

		for (City city : ownedCities) {
			statLine.mergeStatLineExcluding(city.getStatLine(), StatType.CITY_EXCLUSIVE);
		}

		if (increaseValues)
			statLine.updateStatLine();
	}

	public void reduceStatLine(StatLine statLine) {
		this.statLine.reduceStatLine(statLine);
	}

	public void addOwnedUnit(Unit unit) {
		ownedUnits.add(unit);
	}

	public void removeCity(City city) {
		ownedCities.remove(city);
	}

	public void addCity(City city) {
		ownedCities.add(city);
	}

	public ResearchTree getResearchTree() {
		return researchTree;
	}

	public HeritageTree getHeritageTree() {
		return heritageTree;
	}

	public StatLine getStatLine() {
		return statLine;
	}

	public boolean hasBuilt(Class<? extends Building> buildingClass) {
		for (City city : ownedCities) {
			for (Building building : city.getBuildings()) {
				if (building.getClass() == buildingClass)
					return true;
			}
		}

		return false;
	}

	public ArrayList<City> getOwnedCities() {
		return ownedCities;
	}

	public ArrayList<Unit> getOwnedUnits() {
		return ownedUnits;
	}

	public City getCapitalCity() {
		return ownedCities.get(0);
	}

	public Civ getCiv() {
		return civilization;
	}

	public void setCivilization(CivType civType) {
		this.civilization = civType.getCiv(this);
	}

	public void removeUnit(Unit unit) {
		ownedUnits.remove(unit);
	}

	public abstract boolean hasConnection();

}
