package me.rhin.openciv.game.notification.type;

import java.util.ArrayList;
import java.util.Iterator;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.events.type.SelectUnitEvent;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.notification.AbstractNotification;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.actions.BuilderAction;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.SetUnitOwnerPacket;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;

public class AvailableMovementNotification extends AbstractNotification {

	private ArrayList<Unit> availableUnits;
	private int index;

	public AvailableMovementNotification(Unit unit) {
		this.availableUnits = new ArrayList<>();
		this.index = 0;

		availableUnits.add(unit);

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onUnitMove(MoveUnitPacket packet) {

		Tile targetTile = Civilization.getInstance().getGame().getMap().getTiles()[packet.getTargetGridX()][packet
				.getTargetGridY()];

		Tile prevTile = Civilization.getInstance().getGame().getMap().getTiles()[packet.getPrevGridX()][packet
				.getPrevGridY()];

		Unit unit = targetTile.getUnitFromID(packet.getUnitID());

		if (unit == null) {
			unit = prevTile.getUnitFromID(packet.getUnitID());
		}

		if (unit.getCurrentMovement() > 0
				|| !unit.getPlayerOwner().equals(Civilization.getInstance().getGame().getPlayer()))
			return;

		removeUnitFromNotification(unit.getID());
	}

	@EventHandler
	public void onUnitDelete(DeleteUnitPacket packet) {

		// NOTE: We don't use unit Object here since it's already deleted from the
		// tile.x
		int unitID = packet.getUnitID();
		removeUnitFromNotification(unitID);
	}

	@EventHandler
	public void onSetUnitOwner(SetUnitOwnerPacket packet) {
		int unitID = packet.getUnitID();

		Tile tile = Civilization.getInstance().getGame().getMap().getTiles()[packet.getTileGridX()][packet
				.getTileGridY()];

		Unit unit = tile.getUnitFromID(unitID);

		if (!Civilization.getInstance().getGame().getPlayer().getName().equals(packet.getPrevPlayerOwner()))
			return;

		// Remove notification if our unit gets captured.
		removeUnitFromNotification(unit.getID());
	}

	@EventHandler
	public void onBuilderAct(BuilderAction action) {
		Unit unit = action.getUnit();

		removeUnitFromNotification(unit.getID());
	}

	@EventHandler
	public void onUnitAttack(UnitAttackPacket packet) {
		int unitID = packet.getUnitID();

		removeUnitFromNotification(unitID);
	}

	@Override
	public void merge(AbstractNotification notification) {
		super.merge(notification);

		AvailableMovementNotification movementNotification = (AvailableMovementNotification) notification;

		// Add units that are not already in this notification.
		for (Unit unit : movementNotification.getUnits()) {
			boolean sameUnit = false;
			for (Unit availableUnit : availableUnits)
				if (unit.getID() == availableUnit.getID())
					sameUnit = true;

			if (!sameUnit)
				availableUnits.add(unit);
		}
	}

	@Override
	public void act() {
		if (availableUnits.size() < 1) {
			index = 0;
			return;
		}

		if (index >= availableUnits.size())
			index = 0;

		Unit unit = availableUnits.get(index);

		Civilization.getInstance().getScreenManager().getCurrentScreen().setCameraPosition(
				unit.getStandingTile().getX() + unit.getStandingTile().getWidth() / 2,
				unit.getStandingTile().getY() + unit.getStandingTile().getHeight() / 2);

		Civilization.getInstance().getEventManager().fireEvent(new SelectUnitEvent(unit));

		index++;
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_MOVE.sprite();
	}

	@Override
	public String getText() {
		return "You can move\na unit.";
	}

	@Override
	public String getName() {
		return "Movement notification";
	}

	public ArrayList<Unit> getUnits() {
		return availableUnits;
	}

	private void removeUnitFromNotification(int unitID) {
		Iterator<Unit> iterator = availableUnits.iterator();

		// Remove notification if our unit gets captured.

		while (iterator.hasNext()) {
			Unit unit = iterator.next();

			if (unit.getID() == unitID) {
				iterator.remove();
			}
		}

		if (availableUnits.size() < 1) {
			Civilization.getInstance().getGame().getNotificationHanlder().removeNotification(this);
		}
	}
}
