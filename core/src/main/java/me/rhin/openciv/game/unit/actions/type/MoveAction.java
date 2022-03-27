package me.rhin.openciv.game.unit.actions.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.events.type.UnitActEvent;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.actions.AbstractAction;

public class MoveAction extends AbstractAction {

	public MoveAction(Unit unit) {
		super(unit);
	}

	@Override
	public boolean act(float delta) {

		AbstractPlayer player = unit.getPlayerOwner();
		unit.setTargetTile(player.getHoveredTile(), true);
		player.setRightMouseHeld(true);

		Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

		unit.removeAction(this);
		return true;
	}

	@Override
	public boolean canAct() {
		if (unit.getPlayerOwner().isRightMouseHeld() || !unit.allowsMovement())
			return false;

		return unit.getCurrentMovement() > 0;
	}

	@Override
	public String getName() {
		return "Move";
	}

	@Override
	public TextureEnum getSprite() {
		return TextureEnum.ICON_MOVE;
	}
}
