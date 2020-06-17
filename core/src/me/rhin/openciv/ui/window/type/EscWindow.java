package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.ButtonManager;
import me.rhin.openciv.ui.button.type.EscBackButton;
import me.rhin.openciv.ui.button.type.MainMenuButton;
import me.rhin.openciv.ui.window.AbstractWindow;

public class EscWindow extends AbstractWindow {

	private ButtonManager buttonManager;

	public EscWindow() {
		this.buttonManager = new ButtonManager(this);
		
		BlankBackground blankBackground = new BlankBackground(viewport.getWorldWidth() / 2 - 200 / 2,
				viewport.getWorldHeight() / 2 - 400 / 2, 200, 400);
		addActor(blankBackground);

		buttonManager.addButton(new EscBackButton(viewport.getWorldWidth() / 2 - 150 / 2,
				blankBackground.getY() + blankBackground.getHeight() - 55, 150, 45));
		buttonManager.addButton(new MainMenuButton(viewport.getWorldWidth() / 2 - 150 / 2,
				blankBackground.getY() + blankBackground.getHeight() - 110, 150, 45));

	}
	
	@Override
	protected boolean disablesInput() {
		return true;
	}
}
