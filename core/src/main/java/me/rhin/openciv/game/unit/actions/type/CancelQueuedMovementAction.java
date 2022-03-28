package me.rhin.openciv.game.unit.actions.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.events.type.UnitActEvent;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.actions.AbstractAction;
import me.rhin.openciv.shared.packet.type.CancelQueuedMovementPacket;

public class CancelQueuedMovementAction extends AbstractAction {

	public CancelQueuedMovementAction(Unit unit) {
		super(unit);
	}

	@Override
	public boolean canAct() {
		return unit.getQueuedTile() != null;
	}

	@Override
	public String getName() {
		return "Cancel Queued Movement";
	}

	@Override
	public TextureEnum getSprite() {
		return TextureEnum.ICON_CANCEL_MOVE;
	}

	@Override
	public boolean act(float delta) {
		unit.setQueuedTile(null);

		CancelQueuedMovementPacket packet = new CancelQueuedMovementPacket();
		packet.setUnit(unit.getID(), unit.getTile().getGridX(), unit.getTile().getGridY());
		Civilization.getInstance().getNetworkManager().sendPacket(packet);

		Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));
		unit.removeAction(this);

		return true;
	}

}
