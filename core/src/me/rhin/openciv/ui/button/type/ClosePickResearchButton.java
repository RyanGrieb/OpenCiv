package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.PickResearchWindow;

public class ClosePickResearchButton extends Button {

	public ClosePickResearchButton(float x, float y, float width, float height) {
		super("Cancel", x, y, width, height);
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getWindowManager().closeWindow(PickResearchWindow.class);
	}
}
