package me.rhin.openciv.game.player;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.civilization.Civ;
import me.rhin.openciv.game.diplomacy.Diplomacy;
import me.rhin.openciv.game.heritage.HeritageTree;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.notification.type.AvailableMovementNotification;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.shared.stat.StatLine;

public abstract class AbstractPlayer {

	private String name;
	protected ArrayList<City> ownedCities;
	protected ArrayList<Unit> ownedUnits;
	protected StatLine statLine;
	protected Diplomacy diplomacy;
	protected ResearchTree researchTree;
	protected HeritageTree heritageTree;
	private Civ civilization;

	public AbstractPlayer(String name) {

		this.name = name;

		this.ownedCities = new ArrayList<>();
		this.ownedUnits = new ArrayList<>();
		this.statLine = new StatLine();
		this.diplomacy = new Diplomacy(this);

		this.researchTree = new ResearchTree();
		this.heritageTree = new HeritageTree();
	}

	public abstract Tile getHoveredTile();

	public abstract void setRightMouseHeld(boolean b);

	public abstract boolean isRightMouseHeld();

	public abstract void unselectUnit();

	public abstract Unit getSelectedUnit();

	public ResearchTree getResearchTree() {
		return researchTree;
	}

	public HeritageTree getHeritageTree() {
		return heritageTree;
	}

	public ArrayList<City> getOwnedCities() {
		return ownedCities;
	}

	public ArrayList<Unit> getOwnedUnits() {
		return ownedUnits;
	}

	public Civ getCivilization() {
		return civilization;
	}

	public void setCivilization(Civ civilization) {
		this.civilization = civilization;
	}

	public void addUnit(Unit unit) {
		ownedUnits.add(unit);
		System.out.println(unit.getName() + " - " + unit.allowsMovement());
		if (Civilization.getInstance().getGame().getPlayer().equals(this) && unit.allowsMovement())
			Civilization.getInstance().getGame().getNotificationHanlder()
					.fireNotification(new AvailableMovementNotification(unit));
	}

	public void removeUnit(Unit unit) {
		ownedUnits.remove(unit);
	}

	public String getName() {
		return name;
	}

	public void addCity(City city) {
		ownedCities.add(city);
	}

	public City getCityFromName(String name) {
		for (City city : ownedCities)
			if (city.getName().equals(name))
				return city;

		return null;
	}

	public City getCapitalCity() {
		return ownedCities.get(0);
	}

	public void removeCity(City city) {
		ownedCities.remove(city);
	}

	public StatLine getStatLine() {
		return statLine;
	}

	public Diplomacy getDiplomacy() {
		return diplomacy;
	}

}
