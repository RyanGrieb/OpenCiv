package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.EscBackButton;
import me.rhin.openciv.ui.button.type.MainMenuButton;
import me.rhin.openciv.ui.window.AbstractWindow;

public class EscWindow extends AbstractWindow {

	public EscWindow() {

		BlankBackground blankBackground = new BlankBackground(viewport.getWorldWidth() / 2 - 200 / 2,
				viewport.getWorldHeight() / 2 - 400 / 2, 200, 400);
		addActor(blankBackground);

		addActor(new EscBackButton(viewport.getWorldWidth() / 2 - 150 / 2,
				blankBackground.getY() + blankBackground.getHeight() - 55, 150, 45));
		addActor(new MainMenuButton(viewport.getWorldWidth() / 2 - 150 / 2,
				blankBackground.getY() + blankBackground.getHeight() - 110, 150, 45));

	}

	@Override
	public boolean disablesInput() {
		return true;
	}

	@Override
	public boolean closesOtherWindows() {
		return false;
	}
}
