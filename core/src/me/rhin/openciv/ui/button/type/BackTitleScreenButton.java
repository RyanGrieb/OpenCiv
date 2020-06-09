package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.screen.ScreenEnum;

public class BackTitleScreenButton extends Button {

	public BackTitleScreenButton(float x, float y, float width, float height) {
		super("Back", x, y, width, height);
	}

	@Override
	public void onClick() {
		// FIXME: We want to pop off the last visited screen of the ScreenManager's
		// stack instead of manually setting the screen back

		Civilization.getInstance().getScreenManager().setScreen(ScreenEnum.TITLE);
	}

}
