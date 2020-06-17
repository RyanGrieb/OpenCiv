package me.rhin.openciv.ui.window;

import java.util.HashMap;

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
		windows.put(abstractWindow.getClass(), abstractWindow);
	}

	public void toggleWindow(AbstractWindow window) {
		if (windows.containsKey(window.getClass())) {
			windows.remove(window.getClass());
			return;
		}

		windows.put(window.getClass(), window);
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

}
