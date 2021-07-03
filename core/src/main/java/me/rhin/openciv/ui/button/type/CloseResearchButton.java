package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.PickResearchWindow;
import me.rhin.openciv.ui.window.type.ResearchWindow;

public class CloseResearchButton extends Button {

	public CloseResearchButton(float x, float y, float width, float height) {
		super("Close", x, y, width, height);
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getWindowManager().closeWindow(ResearchWindow.class);
		Civilization.getInstance().getWindowManager().closeWindow(PickResearchWindow.class);

	}

}
