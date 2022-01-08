package me.rhin.openciv.game.unit.actions.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.actions.AbstractAction;
import me.rhin.openciv.ui.window.type.FoundReligionWindow;

public class FoundReligionAction extends AbstractAction {

	public FoundReligionAction(Unit unit) {
		super(unit);
	}

	@Override
	public boolean canAct() {
		return unit.getPlayerOwner().getReligion().getPickedBonuses().size() < 2;
	}

	@Override
	public String getName() {
		return "Found Religion";
	}

	@Override
	public TextureEnum getSprite() {
		return TextureEnum.ICON_FAITH;
	}

	@Override
	public boolean act(float delta) {

		Civilization.getInstance().getGame().getPlayer().unselectUnit();
		Civilization.getInstance().getWindowManager().addWindow(new FoundReligionWindow(unit));

		unit.removeAction(this);
		return true;
	}

}
