package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.EscBackButton;
import me.rhin.openciv.ui.button.type.MainMenuButton;
import me.rhin.openciv.ui.window.AbstractWindow;

public class EscWindow extends AbstractWindow implements ResizeListener {

	private BlankBackground blankBackground;
	private EscBackButton escBackButton;
	private MainMenuButton mainMenuButton;

	public EscWindow() {

		this.blankBackground = new BlankBackground(viewport.getWorldWidth() / 2 - 200 / 2,
				viewport.getWorldHeight() / 2 - 400 / 2, 200, 400);
		addActor(blankBackground);

		escBackButton = new EscBackButton(viewport.getWorldWidth() / 2 - 150 / 2,
				blankBackground.getY() + blankBackground.getHeight() - 55, 150, 45);
		addActor(escBackButton);

		mainMenuButton = new MainMenuButton(viewport.getWorldWidth() / 2 - 150 / 2,
				blankBackground.getY() + blankBackground.getHeight() - 110, 150, 45);
		addActor(mainMenuButton);

		Civilization.getInstance().getGame().getPlayer().unselectUnit();

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	@Override
	public void onResize(int width, int height) {
		blankBackground.setPosition(width / 2 - 200 / 2, height / 2 - 400 / 2);
		escBackButton.setPosition(width / 2 - 150 / 2, blankBackground.getY() + blankBackground.getHeight() - 55);
		mainMenuButton.setPosition(width / 2 - 150 / 2, blankBackground.getY() + blankBackground.getHeight() - 110);
	}

	@Override
	public boolean disablesInput() {
		return true;
	}

	@Override
	public boolean disablesCameraMovement() {
		return false;
	}

	@Override
	public boolean closesOtherWindows() {
		return true;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return false;
	}
}
