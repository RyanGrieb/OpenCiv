package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.screen.ScreenEnum;

public class PreviousScreenButton extends Button {

	public PreviousScreenButton(float x, float y, float width, float height) {
		super("Back", x, y, width, height);
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getScreenManager().revertToPreviousScreen();
	}

}
