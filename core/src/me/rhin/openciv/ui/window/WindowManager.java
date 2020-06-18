package me.rhin.openciv.ui.window;

import java.util.HashMap;

import com.badlogic.gdx.scenes.scene2d.Stage;

public class WindowManager {

	private HashMap<Class<? extends AbstractWindow>, AbstractWindow> windows;

	public WindowManager() {
		this.windows = new HashMap<>();
	}

	public void onRender() {
		boolean inputAllowed = allowsInput();
		for (AbstractWindow window : windows.values()) {
			if (!inputAllowed && window.disablesInput()) {
				window.act();
				window.draw();
			} else if (inputAllowed) {
				window.act();
				window.draw();
			}
		}
	}

	public void addWindow(AbstractWindow abstractWindow) {
		if (abstractWindow.closesOtherWindows()) {
			for (AbstractWindow window : windows.values())
				closeWindow(window.getClass());
		}
		windows.put(abstractWindow.getClass(), abstractWindow);
	}

	public void toggleWindow(AbstractWindow abstractWindow) {
		if (windows.containsKey(abstractWindow.getClass())) {
			windows.remove(abstractWindow.getClass());
			return;
		}

		if (abstractWindow.closesOtherWindows()) {
			for (AbstractWindow window : windows.values())
				closeWindow(window.getClass());
		}

		windows.put(abstractWindow.getClass(), abstractWindow);
	}

	public void closeWindow(Class<? extends AbstractWindow> windowClass) {
		windows.remove(windowClass);
	}

	public boolean allowsInput() {
		for (AbstractWindow window : windows.values()) {
			if (window.disablesInput())
				return false;
		}

		return true;
	}

	public boolean isDisabledWindow(Stage stage) {
		for (AbstractWindow window : windows.values()) {
			if (window.disablesInput() && window.getClass().equals(stage.getClass()))
				return true;
		}
		return false;
	}
}
