package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.shared.packet.type.FoundReligionPacket;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.FoundReligionWindow;

public class FoundReligionButton extends Button {

	public FoundReligionButton(float x, float y, float width, float height) {
		super("Found Religion", x, y, width, height);
	}

	@Override
	public void onClick() {
		FoundReligionWindow window = (FoundReligionWindow) getParent();

		Unit unit = window.getUnit();

		FoundReligionPacket packet = new FoundReligionPacket();
		packet.setReligion(unit.getID(), unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY(),
				window.getReligionIcon().ordinal(), window.getFounderBonus().getID(),
				window.getFollowerBonus().getID());

		Civilization.getInstance().getNetworkManager().sendPacket(packet);

		Civilization.getInstance().getWindowManager().closeWindow(window.getClass());
	}

}
