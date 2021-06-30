package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.ui.button.Button;

public class PickResearchButton extends Button {

	private Technology tech;

	public PickResearchButton(Technology tech, float x, float y, float width, float height) {
		super("Research", x, y, width, height);
	}

	@Override
	public void onClick() {
		// TODO: Send packet
	}
}
