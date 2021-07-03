package me.rhin.openciv.game.player;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.civilization.CivType;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.listener.LeftClickEnemyUnitListener.LeftClickEnemyUnitEvent;
import me.rhin.openciv.listener.LeftClickListener;
import me.rhin.openciv.listener.PlayerStatUpdateListener;
import me.rhin.openciv.listener.RelativeMouseMoveListener;
import me.rhin.openciv.listener.RightClickListener;
import me.rhin.openciv.listener.SelectUnitListener;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.util.ClickType;

public class Player implements RelativeMouseMoveListener, LeftClickListener, RightClickListener, SelectUnitListener,
		PlayerStatUpdateListener {

	// NOTE: This class can be the controlled by the player or the MPPlayer. The
	// distinction is in the listeners firing.
	private String name;
	private Tile hoveredTile;
	private Unit selectedUnit;
	private ArrayList<City> ownedCities;
	private ArrayList<Unit> ownedUnits;
	private StatLine statLine;
	private ResearchTree researchTree;
	private boolean rightMouseHeld;
	private CivType civType;

	public Player(String name) {
		this.name = name;
		this.ownedCities = new ArrayList<>();
		this.ownedUnits = new ArrayList<>();
		this.statLine = new StatLine();
		this.researchTree = new ResearchTree();
	}

	@Override
	public void onRelativeMouseMove(float x, float y) {
		Tile currentHoveredTile = Civilization.getInstance().getGame().getMap().getTileFromLocation(x, y);

		if (currentHoveredTile == null)
			return;

		if (rightMouseHeld) {
			if (selectedUnit != null)
				selectedUnit.setTargetTile(currentHoveredTile, true);
		}

		if (hoveredTile != null)
			hoveredTile.onMouseUnhover();

		hoveredTile = currentHoveredTile;
		hoveredTile.onMouseHover();
	}

	@Override
	public void onLeftClick(float x, float y) {
		if (hoveredTile == null)
			return;

		if (hoveredTile.getUnits().size() < 1)
			return;

		Unit unit = hoveredTile.getNextUnit();
		if (!unit.getPlayerOwner().equals(this)) {

			Civilization.getInstance().getEventManager().fireEvent(new LeftClickEnemyUnitEvent(unit));
			return;
		}
		if (unit.isSelected())
			return;

		SelectUnitPacket packet = new SelectUnitPacket();
		packet.setUnitID(unit.getID());
		packet.setLocation(hoveredTile.getGridX(), hoveredTile.getGridY());
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

	@Override
	public void onRightClick(ClickType clickType, int x, int y) {
		if (selectedUnit == null)
			return;

		if (clickType == ClickType.DOWN) {
			selectedUnit.setTargetTile(hoveredTile, true);
			rightMouseHeld = true;
		} else {
			if (selectedUnit.getCurrentMovement() >= selectedUnit.getPathMovement()) {
				selectedUnit.sendMovementPacket();
			}
			unselectUnit();
			rightMouseHeld = false;
		}
	}

	@Override
	public void onSelectUnit(SelectUnitPacket packet) {
		if (selectedUnit != null)
			selectedUnit.setSelected(false);

		Unit unit = Civilization.getInstance().getGame().getMap().getTiles()[packet.getGridX()][packet.getGridY()]
				.getUnitFromID(packet.getUnitID());
		unit.setSelected(true);
		selectedUnit = unit;
	}

	@Override
	public void onPlayerStatUpdate(PlayerStatUpdatePacket packet) {
		this.statLine = StatLine.fromPacket(packet);
	}

	public String getName() {
		return name;
	}

	// FIXME: Does the server know we don't have this unit selected anymore?
	public void unselectUnit() {
		if (selectedUnit == null)
			return;

		selectedUnit.setSelected(false);
		this.selectedUnit = null;
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

	public ResearchTree getResearchTree() {
		return researchTree;
	}

	public ArrayList<City> getOwnedCities() {
		return ownedCities;
	}

	public ArrayList<Unit> getOwnedUnits() {
		return ownedUnits;
	}

	public void addUnit(Unit unit) {
		ownedUnits.add(unit);
	}

	public void removeUnit(Unit unit) {
		ownedUnits.remove(unit);

		if (selectedUnit != null && selectedUnit.equals(unit))
			unselectUnit();
	}

	public CivType getCivType() {
		return civType;
	}

	public void setCivType(CivType civType) {
		this.civType = civType;
	}

	public void removeCity(City city) {
		ownedCities.remove(city);
	}

	public StatLine getStatLine() {
		return statLine;
	}

	public Tile getHoveredTile() {
		return hoveredTile;
	}

	public Unit getSelectedUnit() {
		return selectedUnit;
	}
}
