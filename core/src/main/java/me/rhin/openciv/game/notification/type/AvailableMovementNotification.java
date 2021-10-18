package me.rhin.openciv.game.notification.type;

import java.util.ArrayList;
import java.util.Iterator;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.notification.AbstractNotification;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.listener.DeleteUnitListener;
import me.rhin.openciv.listener.MoveUnitListener;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;

public class AvailableMovementNotification extends AbstractNotification
		implements MoveUnitListener, DeleteUnitListener {

	private ArrayList<Unit> availableUnits;
	private int index;

	public AvailableMovementNotification(Unit unit) {
		this.availableUnits = new ArrayList<>();
		this.index = 0;

		availableUnits.add(unit);

		Civilization.getInstance().getEventManager().addListener(MoveUnitListener.class, this);
		Civilization.getInstance().getEventManager().addListener(DeleteUnitListener.class, this);
	}

	@Override
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

		availableUnits.remove(unit);

		if (availableUnits.size() < 1) {
			Civilization.getInstance().getGame().getNotificationHanlder().removeNotification(this);
		}
	}

	@Override
	public void onUnitDelete(DeleteUnitPacket packet) {

		// Since the unit is already removed from the tile, we need to use the ID here.
		int unitID = packet.getUnitID();

		Iterator<Unit> iterator = availableUnits.iterator();

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

		SelectUnitPacket packet = new SelectUnitPacket();
		packet.setUnitID(unit.getID());
		packet.setLocation(unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
		Civilization.getInstance().getNetworkManager().sendPacket(packet);

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
}
