package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.EscWindow;

public class EscBackButton extends Button {

	public EscBackButton(float x, float y, float width, float height) {
		super("Back", x, y, width, height);
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getWindowManager().closeWindow(EscWindow.class);
	}
}
