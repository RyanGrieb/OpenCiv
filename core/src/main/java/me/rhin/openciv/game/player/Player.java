package me.rhin.openciv.game.player;

import java.util.ArrayList;
import java.util.Iterator;

import com.badlogic.gdx.utils.Timer;
import com.badlogic.gdx.utils.Timer.Task;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.civilization.Civ;
import me.rhin.openciv.game.heritage.HeritageTree;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.notification.type.MoveUnitHelpNotification;
import me.rhin.openciv.game.notification.type.MovementRangeHelpNotification;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.unit.RangedUnit;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.listener.DeleteUnitListener;
import me.rhin.openciv.listener.LeftClickEnemyUnitListener.LeftClickEnemyUnitEvent;
import me.rhin.openciv.listener.LeftClickListener;
import me.rhin.openciv.listener.PlayerStatUpdateListener;
import me.rhin.openciv.listener.RelativeMouseMoveListener;
import me.rhin.openciv.listener.RightClickListener;
import me.rhin.openciv.listener.SelectUnitListener;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.util.ClickType;

public class Player implements RelativeMouseMoveListener, LeftClickListener, RightClickListener, SelectUnitListener,
		PlayerStatUpdateListener, DeleteUnitListener {

	// NOTE: This class can be the controlled by the player or the MPPlayer. The
	// distinction is in the listeners firing.
	private String name;
	private Tile hoveredTile;
	private Unit selectedUnit;
	private ArrayList<City> ownedCities;
	private ArrayList<Unit> ownedUnits;
	private StatLine statLine;
	private ResearchTree researchTree;
	private HeritageTree heritageTree;
	private boolean rightMouseHeld;
	private Civ civilization;
	private int clicksPerSecond;
	private int caravanAmount;

	public Player(String name) {
		this.name = name;
		this.ownedCities = new ArrayList<>();
		this.ownedUnits = new ArrayList<>();
		this.statLine = new StatLine();

		this.researchTree = new ResearchTree();
		this.heritageTree = new HeritageTree();

		Timer.schedule(new Task() {
			@Override
			public void run() {
				clicksPerSecond = 0;
			}
		}, 0, 1);
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
		clicksPerSecond++;

		if (hoveredTile == null)
			return;

		if (selectedUnit != null && clicksPerSecond > 0 && !(selectedUnit instanceof RangedUnit)
				&& Civilization.getInstance().getGame().getTurn() < 2) {
			Civilization.getInstance().getGame().getNotificationHanlder()
					.fireNotification(new MoveUnitHelpNotification());
		}

		if (hoveredTile.getUnits().size() < 1)
			return;

		Unit unit = hoveredTile.getNextUnit();
		if (!unit.getPlayerOwner().equals(this)) {

			Civilization.getInstance().getEventManager().fireEvent(new LeftClickEnemyUnitEvent(unit));
			return;
		}
		if (unit.isSelected()) {
			return;
		}

		SelectUnitPacket packet = new SelectUnitPacket();
		packet.setUnitID(unit.getID());
		packet.setLocation(hoveredTile.getGridX(), hoveredTile.getGridY());
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

	@Override
	public void onRightClick(ClickType clickType, int x, int y) {
		if (selectedUnit == null)
			return;

		if (!selectedUnit.allowsMovement())
			return;

		if (clickType == ClickType.DOWN) {
			selectedUnit.setTargetTile(hoveredTile, true);
			rightMouseHeld = true;
		} else {
			if (selectedUnit.getCurrentMovement() >= selectedUnit.getPathMovement()) {
				selectedUnit.sendMovementPacket();
			} else {
				if (Civilization.getInstance().getGame().getTurn() < 2)
					Civilization.getInstance().getGame().getNotificationHanlder()
							.fireNotification(new MovementRangeHelpNotification());
			}

			unselectUnit();
			rightMouseHeld = false;
		}
	}

	@Override
	public void onSelectUnit(SelectUnitPacket packet) {
		if (selectedUnit != null)
			unselectUnit();

		Unit unit = Civilization.getInstance().getGame().getMap().getTiles()[packet.getGridX()][packet.getGridY()]
				.getUnitFromID(packet.getUnitID());
		unit.setSelected(true);
		selectedUnit = unit;
	}

	@Override
	public void onPlayerStatUpdate(PlayerStatUpdatePacket packet) {
		this.statLine = StatLine.fromPacket(packet);
	}

	@Override
	public void onUnitDelete(DeleteUnitPacket packet) {
		int unitID = packet.getUnitID();

		Iterator<Unit> iterator = ownedUnits.iterator();

		while (iterator.hasNext()) {
			Unit unit = iterator.next();

			if (unit.getID() == unitID) {
				iterator.remove();
			}
		}
	}

	public void setRightMouseHeld(boolean rightMouseHeld) {
		this.rightMouseHeld = rightMouseHeld;
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
		rightMouseHeld = false;
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

	public HeritageTree getHeritageTree() {
		return heritageTree;
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

	public Civ getCivilization() {
		return civilization;
	}

	public void setCivilization(Civ civilization) {
		this.civilization = civilization;
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

	public boolean isRightMouseHeld() {
		return rightMouseHeld;
	}

	public City getCapitalCity() {
		return ownedCities.get(0);
	}

	public int getCaravanAmount() {
		return caravanAmount;
	}

	public void setCaravanAmount(int caravanAmount) {
		this.caravanAmount = caravanAmount;
	}
}
