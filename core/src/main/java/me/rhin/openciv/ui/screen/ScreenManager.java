package me.rhin.openciv.ui.screen;

import java.util.Stack;

import me.rhin.openciv.Civilization;

public class ScreenManager {

	// TODO: Have a stack of previously set screen. This way we have an easy way to
	// go back to our previous screens.

	private AbstractScreen currentScreen;
	private Stack<ScreenEnum> previousScreens;

	public ScreenManager() {
		this.previousScreens = new Stack<>();
	}

	public void setScreen(ScreenEnum screenEnum) {
		AbstractScreen newScreen = screenEnum.getScreen();

		if (currentScreen != null) {
			previousScreens.push(currentScreen.getType());
			currentScreen.dispose();
		}

		currentScreen = newScreen;
		Civilization.getInstance().setScreen(newScreen);
	}

	public AbstractScreen getCurrentScreen() {
		return currentScreen;
	}

	public void revertToPreviousScreen() {
		//FIXME: Remove this redundant code from setScreen()
		AbstractScreen newScreen = previousScreens.pop().getScreen();

		if (currentScreen != null) {
			currentScreen.dispose();
		}

		currentScreen = newScreen;
		Civilization.getInstance().setScreen(newScreen);
	}

}
