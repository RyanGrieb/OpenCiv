package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.GameOptionsWindow;

public class GameOptionsButton extends Button {

	public GameOptionsButton(float x, float y, float width, float height) {
		super("Options", x, y, width, height);
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getWindowManager().addWindow(new GameOptionsWindow());
	}
}
