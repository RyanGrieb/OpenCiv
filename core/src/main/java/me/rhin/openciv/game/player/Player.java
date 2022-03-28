package me.rhin.openciv.game.player;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import com.badlogic.gdx.utils.Timer;
import com.badlogic.gdx.utils.Timer.Task;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.events.type.LeftClickEnemyUnitEvent;
import me.rhin.openciv.events.type.SelectUnitEvent;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.notification.type.MoveUnitHelpNotification;
import me.rhin.openciv.game.research.Unlockable;
import me.rhin.openciv.game.unit.AttackableEntity;
import me.rhin.openciv.game.unit.RangedUnit;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.ChangeNamePacket;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.QueuedUnitMovementPacket;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.ui.window.type.CityInfoWindow;
import me.rhin.openciv.ui.window.type.DeclareWarWindow;
import me.rhin.openciv.util.ClickType;

public class Player extends AbstractPlayer implements Listener {

	// NOTE: This class can be the controlled by the player or the MPPlayer. The
	// distinction is in the listeners firing.
	private Tile hoveredTile;
	private Unit selectedUnit;
	private boolean rightMouseHeld;
	private int clicksPerSecond;

	public Player(String name) {
		super(name);

		Timer.schedule(new Task() {
			@Override
			public void run() {
				clicksPerSecond = 0;
			}
		}, 0, 1);

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
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

	@EventHandler
	public void onLeftClick(int x, int y) {
		clicksPerSecond++;

		if (hoveredTile == null)
			return;

		if (Civilization.getInstance().getWindowManager().isOpenWindow(CityInfoWindow.class))
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

		// SelectUnitPacket packet = new SelectUnitPacket();
		// packet.setUnitID(unit.getID());
		// packet.setLocation(hoveredTile.getGridX(), hoveredTile.getGridY());
		// Civilization.getInstance().getNetworkManager().sendPacket(packet);

		Civilization.getInstance().getEventManager().fireEvent(new SelectUnitEvent(unit));
	}

	@EventHandler
	public void onRightClick(ClickType clickType, int x, int y) {
		if (selectedUnit == null)
			return;

		if (!selectedUnit.allowsMovement())
			return;

		if (clickType == ClickType.DOWN) {
			selectedUnit.setTargetTile(hoveredTile, true);
			rightMouseHeld = true;
		} else {

			if (selectedUnit.getCurrentMovement() >= selectedUnit.getPathMovement()
					&& selectedUnit.getTargetTile() != null) {

				// If were moving onto a unit thats not ours & not at war. Bring up declare war
				// window.
				if (selectedUnit.getTargetTile().getAttackableEntity() != null
						&& !selectedUnit.getTargetTile().getAttackableEntity().getPlayerOwner().equals(this)) {

					AttackableEntity attackableEntity = selectedUnit.getTargetTile().getAttackableEntity();
					if (!attackableEntity.getPlayerOwner().getDiplomacy().atWar(this)) {
						Civilization.getInstance().getWindowManager()
								.addWindow(new DeclareWarWindow(this, attackableEntity.getPlayerOwner()));
					}
				}

				selectedUnit.setQueuedTile(null);
				selectedUnit.sendMovementPacket();

			} else {

				if (selectedUnit.getTargetTile() != null) {
					// if (Civilization.getInstance().getGame().getTurn() < 2)
					// Civilization.getInstance().getGame().getNotificationHanlder()
					// .fireNotification(new MovementRangeHelpNotification());
					selectedUnit.setQueuedTile(selectedUnit.getTargetTile());

					QueuedUnitMovementPacket packet = new QueuedUnitMovementPacket();
					packet.setUnit(selectedUnit.getPlayerOwner().getName(), selectedUnit.getID(),
							selectedUnit.getTile().getGridX(), selectedUnit.getTile().getGridY(),
							selectedUnit.getQueuedTile().getGridX(), selectedUnit.getQueuedTile().getGridY());
					Civilization.getInstance().getNetworkManager().sendPacket(packet);
				}

			}

			unselectUnit();
			rightMouseHeld = false;
		}
	}

	@EventHandler
	public void onSelectUnit(Unit unit) {
		if (selectedUnit != null)
			unselectUnit();

		unit.setSelected(true);
		selectedUnit = unit;
	}

	@EventHandler
	public void onPlayerStatUpdate(PlayerStatUpdatePacket packet) {
		this.statLine = StatLine.fromPacket(packet);
	}

	@EventHandler
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

	@Override
	public void removeUnit(Unit unit) {
		ownedUnits.remove(unit);

		if (selectedUnit != null && selectedUnit.equals(unit))
			unselectUnit();
	}

	public void setRightMouseHeld(boolean rightMouseHeld) {
		this.rightMouseHeld = rightMouseHeld;
	}

	// FIXME: Does the server know we don't have this unit selected anymore?
	public void unselectUnit() {
		if (selectedUnit == null)
			return;

		selectedUnit.setSelected(false);
		this.selectedUnit = null;
		rightMouseHeld = false;
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

	public List<Unlockable> getUnlockablesByName(String... items) {
		List<Unlockable> productionItems = new ArrayList<>();

		for (String item : items) {
			productionItems.add(getCapitalCity().getProducibleItemManager().getPossibleItems().get(item));
		}

		return productionItems;
	}
}
