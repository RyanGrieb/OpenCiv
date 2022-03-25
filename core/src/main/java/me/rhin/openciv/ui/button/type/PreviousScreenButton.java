package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.AbstractButton;

public class PreviousScreenButton extends AbstractButton {

	public PreviousScreenButton(String text, float x, float y, float width, float height) {
		super(text, x, y, width, height);
	}

	@Override
	public void onClicked() {
		Civilization.getInstance().getScreenManager().revertToPreviousScreen();
	}

}
