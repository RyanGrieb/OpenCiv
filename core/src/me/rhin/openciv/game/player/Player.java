package me.rhin.openciv.game.player;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.listener.LeftClickListener;
import me.rhin.openciv.listener.RelativeMouseMoveListener;
import me.rhin.openciv.listener.RightClickListener;
import me.rhin.openciv.listener.SelectUnitListener;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
import me.rhin.openciv.util.ClickType;

public class Player implements RelativeMouseMoveListener, LeftClickListener, RightClickListener, SelectUnitListener {

	// NOTE: This class can be the controlled by the player or the MPPlayer. The
	// distinction is in the listeners firing.
	private String name;
	private Tile hoveredTile;
	private Unit selectedUnit;
	private ArrayList<City> ownedCities;
	private boolean rightMouseHeld;

	public Player(String name) {
		this.name = name;
		this.ownedCities = new ArrayList<>();
	}

	@Override
	public void onRelativeMouseMove(float x, float y) {
		Tile currentHoveredTile = Civilization.getInstance().getGame().getMap().getTileFromLocation(x, y);

		if (currentHoveredTile == null)
			return;

		if (rightMouseHeld) {
			selectedUnit.setTargetTile(currentHoveredTile);
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

		// TODO: Account for clicking on cities in the future.
		if (hoveredTile.getUnits().size() < 1)
			return;

		Unit unit = hoveredTile.getUnits().get(0);
		if (!unit.getPlayerOwner().equals(this))
			return;

		if (unit.isSelected())
			return;

		SelectUnitPacket packet = new SelectUnitPacket();
		packet.setUnitName(unit.getClass().getName());
		packet.setLocation(hoveredTile.getGridX(), hoveredTile.getGridY());
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

	@Override
	public void onRightClick(ClickType clickType, int x, int y) {
		if (selectedUnit == null)
			return;

		if (clickType == ClickType.DOWN) {
			selectedUnit.setTargetTile(hoveredTile);
			rightMouseHeld = true;
		} else {
			if (selectedUnit.getCurrentMovement() >= selectedUnit.getPathMovement())
				selectedUnit.sendMovementPacket();
			unselectUnit();
			rightMouseHeld = false;
		}
	}

	@Override
	public void onSelectUnit(SelectUnitPacket packet) {
		Unit unit = Civilization.getInstance().getGame().getMap().getTiles()[packet.getGridX()][packet.getGridY()]
				.getUnits().get(0);
		unit.setSelected(true);
		selectedUnit = unit;
	}

	public String getName() {
		return name;
	}

	public void unselectUnit() {
		if (selectedUnit == null)
			return;

		selectedUnit.setSelected(false);
		this.selectedUnit = null;
	}

	public void addCity(City city) {
		ownedCities.add(city);
	}

}
