package me.rhin.openciv.game.unit.actions.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.actions.AbstractAction;
import me.rhin.openciv.shared.packet.type.UpgradeUnitPacket;
import me.rhin.openciv.shared.stat.Stat;

public class UpgradeAction extends AbstractAction {

	public UpgradeAction(Unit unit) {
		super(unit);
	}

	@Override
	public boolean act(float delta) {

		UpgradeUnitPacket packet = new UpgradeUnitPacket();
		packet.setUnit(unit.getID(), unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());

		Civilization.getInstance().getNetworkManager().sendPacket(packet);

		unit.removeAction(this);
		return true;
	}

	@Override
	public boolean canAct() {

		if (unit.getPlayerOwner().getStatLine().getStatValue(Stat.GOLD) < 100
				|| unit.getStandingTile().getTerritory() == null
				|| !unit.getStandingTile().getTerritory().getPlayerOwner().equals(unit.getPlayerOwner()))
			return false;

		return unit.canUpgrade();
	}

	@Override
	public String getName() {
		return "Upgrade";
	}

	@Override
	public TextureEnum getSprite() {
		return TextureEnum.ICON_UPGRADE_UNIT;
	}
}