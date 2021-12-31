package me.rhin.openciv.game.player;

import java.util.Iterator;

import com.badlogic.gdx.utils.Timer;
import com.badlogic.gdx.utils.Timer.Task;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.notification.type.MoveUnitHelpNotification;
import me.rhin.openciv.game.notification.type.MovementRangeHelpNotification;
import me.rhin.openciv.game.unit.AttackableEntity;
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
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.ui.window.type.CityInfoWindow;
import me.rhin.openciv.ui.window.type.DeclareWarWindow;
import me.rhin.openciv.util.ClickType;

public class Player extends AbstractPlayer implements RelativeMouseMoveListener, LeftClickListener, RightClickListener,
		SelectUnitListener, PlayerStatUpdateListener, DeleteUnitListener {

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

				// If were moving onto a unit thats not ours & not at war. Bring up declare war
				// window.
				if (selectedUnit.getTargetTile() != null && selectedUnit.getTargetTile().getAttackableEntity() != null
						&& !selectedUnit.getTargetTile().getAttackableEntity().getPlayerOwner().equals(this)) {

					AttackableEntity attackableEntity = selectedUnit.getTargetTile().getAttackableEntity();
					if (!attackableEntity.getPlayerOwner().getDiplomacy().atWar(this)) {
						Civilization.getInstance().getWindowManager()
								.addWindow(new DeclareWarWindow(this, attackableEntity.getPlayerOwner()));
					}
				}
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
	public void onSelectUnit(Unit unit) {
		if (selectedUnit != null)
			unselectUnit();

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
}
