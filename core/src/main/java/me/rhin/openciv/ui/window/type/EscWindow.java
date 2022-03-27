package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.screen.ScreenEnum;
import me.rhin.openciv.ui.window.AbstractWindow;

public class EscWindow extends AbstractWindow {

	private BlankBackground blankBackground;
	private CloseWindowButton closeWindowButton;
	private CustomButton gameOptionsButton;
	private CustomButton mainMenuButton;

	public EscWindow() {

		this.blankBackground = new BlankBackground(viewport.getWorldWidth() / 2 - 200 / 2,
				viewport.getWorldHeight() / 2 - 400 / 2, 200, 400);
		addActor(blankBackground);

		closeWindowButton = new CloseWindowButton(this.getClass(), "Back", viewport.getWorldWidth() / 2 - 150 / 2,
				blankBackground.getY() + blankBackground.getHeight() - 55, 150, 45);
		addActor(closeWindowButton);

		gameOptionsButton = new CustomButton("Options", viewport.getWorldWidth() / 2 - 150 / 2,
				blankBackground.getY() + blankBackground.getHeight() - 110, 150, 45);
		gameOptionsButton.onClick(() -> {
			Civilization.getInstance().getWindowManager().addWindow(new GameOptionsWindow());
		});
		addActor(gameOptionsButton);

		mainMenuButton = new CustomButton("Main Menu", viewport.getWorldWidth() / 2 - 150 / 2,
				blankBackground.getY() + blankBackground.getHeight() - 165, 150, 45);
		mainMenuButton.onClick(() -> {
			Civilization.getInstance().getScreenManager().setScreen(ScreenEnum.TITLE);
		});
		addActor(mainMenuButton);

		Civilization.getInstance().getGame().getPlayer().unselectUnit();
	}

	@EventHandler
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
