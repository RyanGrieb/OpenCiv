package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.listener.PickResearchListener.PickResearchEvent;
import me.rhin.openciv.shared.packet.type.ChooseTechPacket;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.PickResearchWindow;

public class PickResearchButton extends Button {

	private Technology tech;

	public PickResearchButton(Technology tech, float x, float y, float width, float height) {
		super("Research", x, y, width, height);

		this.tech = tech;
	}

	@Override
	public void onClick() {
		ChooseTechPacket packet = new ChooseTechPacket();
		packet.setTech(tech.getID());
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
		Civilization.getInstance().getWindowManager().closeWindow(PickResearchWindow.class);

		for (Technology tech : Civilization.getInstance().getGame().getPlayer().getResearchTree().getTechnologies())
			tech.setResearching(false);

		tech.setResearching(true);

		Civilization.getInstance().getEventManager().fireEvent(new PickResearchEvent(tech));
	}
}
