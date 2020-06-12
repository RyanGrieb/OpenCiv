package me.rhin.openciv.ui.screen;

import me.rhin.openciv.Civilization;

public class ScreenManager {

	// TODO: Have a stack of previously set screen. This way we have an easy way to
	// go back to our previous screens.

	private AbstractScreen currentScreen;

	public void setScreen(ScreenEnum screenEnum) {
		AbstractScreen newScreen = screenEnum.getScreen();

		if (currentScreen != null) {
			currentScreen.dispose();
		}

		currentScreen = newScreen;
		
		Civilization.getInstance().setScreen(newScreen);
	}

	public AbstractScreen getCurrentScreen() {
		return currentScreen;
	}

}
