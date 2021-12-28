package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.button.type.GameOptionsButton;
import me.rhin.openciv.ui.button.type.MainMenuButton;
import me.rhin.openciv.ui.window.AbstractWindow;

public class EscWindow extends AbstractWindow implements ResizeListener {

	private BlankBackground blankBackground;
	private CloseWindowButton closeWindowButton;
	private GameOptionsButton gameOptionsButton;
	private MainMenuButton mainMenuButton;

	public EscWindow() {

		this.blankBackground = new BlankBackground(viewport.getWorldWidth() / 2 - 200 / 2,
				viewport.getWorldHeight() / 2 - 400 / 2, 200, 400);
		addActor(blankBackground);

		closeWindowButton = new CloseWindowButton(this.getClass(), "Back", viewport.getWorldWidth() / 2 - 150 / 2,
				blankBackground.getY() + blankBackground.getHeight() - 55, 150, 45);
		addActor(closeWindowButton);
		
		gameOptionsButton = new GameOptionsButton(viewport.getWorldWidth() / 2 - 150 / 2,
				blankBackground.getY() + blankBackground.getHeight() - 110, 150, 45);
		addActor(gameOptionsButton);
		
		mainMenuButton = new MainMenuButton(viewport.getWorldWidth() / 2 - 150 / 2,
				blankBackground.getY() + blankBackground.getHeight() - 165, 150, 45);
		addActor(mainMenuButton);

		Civilization.getInstance().getGame().getPlayer().unselectUnit();

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	@Override
	public void onResize(int width, int height) {
		blankBackground.setPosition(width / 2 - 200 / 2, height / 2 - 400 / 2);
		closeWindowButton.setPosition(width / 2 - 150 / 2, blankBackground.getY() + blankBackground.getHeight() - 55);
		gameOptionsButton.setPosition(width / 2 - 150 / 2, blankBackground.getY() + blankBackground.getHeight() - 110);
		mainMenuButton.setPosition(width / 2 - 150 / 2, blankBackground.getY() + blankBackground.getHeight() - 165);
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
