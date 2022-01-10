package me.rhin.openciv.game.unit.actions.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.actions.AbstractAction;
import me.rhin.openciv.shared.packet.type.SpreadReligionPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.window.type.UnitWindow;

public class SpreadReligionAction extends AbstractAction {

	public SpreadReligionAction(Unit unit) {
		super(unit);
	}

	@Override
	public boolean canAct() {
		if (unit.getCurrentMovement() < 1)
			return false;

		if (unit.getStandingTile().getTerritory() == null)
			return false;

		if (unit.getStandingTile().getTerritory().getCityReligion().getFollowersOfReligion(unit.getPlayerOwner().getReligion()) >= unit.getStandingTile()
				.getTerritory().getStatLine().getStatValue(Stat.POPULATION))
			return false;

		return true;
	}

	@Override
	public String getName() {
		return "Spread " + unit.getPlayerOwner().getReligion().getReligionIcon().getName();
	}

	@Override
	public TextureEnum getSprite() {
		return TextureEnum.ICON_HOLYBOOK;
	}

	@Override
	public boolean act(float delta) {

		unit.reduceMovement(2);

		SpreadReligionPacket packet = new SpreadReligionPacket();
		packet.setSpreadTarget(unit.getID(), unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY(),
				unit.getStandingTile().getTerritory().getName());

		Civilization.getInstance().getNetworkManager().sendPacket(packet);

		unit.removeAction(this);

		// FIXME: This is bad. Window should know to update itself.
		Civilization.getInstance().getWindowManager().getWindow(UnitWindow.class).updateActionButtons();
		return true;
	}

}
