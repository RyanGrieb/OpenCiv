package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.listener.PickResearchListener.PickResearchEvent;
import me.rhin.openciv.shared.packet.type.ChooseTechPacket;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.PickResearchWindow;
import me.rhin.openciv.ui.window.type.ResearchWindow;

public class PickResearchButton extends Button {

	private Technology tech;

	public PickResearchButton(Technology tech, float x, float y, float width, float height) {
		super("Research", x, y, width, height);

		this.tech = tech;
	}

	@Override
	public void onClick() {

		if (tech.hasResearchedRequiredTechs()) {

			// Reset the tech queue if the player manually changes the tech.
			Civilization.getInstance().getGame().getPlayer().getResearchTree().clearTechQueue();

			tech.research();

		} else {
			Civilization.getInstance().getGame().getPlayer().getResearchTree()
					.setTechQueue(tech.getRequiedTechsQueue());

			// TODO: Reference tech leafs to represent a queued tech.
		}
	}
}
