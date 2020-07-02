package me.rhin.openciv.ui.window;

import java.util.HashMap;

import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;

import me.rhin.openciv.Civilization;

public class WindowManager {

	private HashMap<Class<? extends AbstractWindow>, AbstractWindow> windows;

	public WindowManager() {
		this.windows = new HashMap<>();
	}

	public void addWindow(AbstractWindow abstractWindow) {
		if (abstractWindow.closesOtherWindows()) {
			for (AbstractWindow window : windows.values())
				closeWindow(window.getClass());
		}
		Civilization.getInstance().getScreenManager().getCurrentScreen().getOverlayStage().addActor(abstractWindow);
		windows.put(abstractWindow.getClass(), abstractWindow);
	}

	public void toggleWindow(AbstractWindow abstractWindow) {
		if (windows.containsKey(abstractWindow.getClass())) {
			closeWindow(abstractWindow.getClass());
			return;
		}

		if (abstractWindow.closesOtherWindows()) {
			for (AbstractWindow window : windows.values())
				closeWindow(window.getClass());
		}

		Civilization.getInstance().getScreenManager().getCurrentScreen().getOverlayStage().addActor(abstractWindow);
		windows.put(abstractWindow.getClass(), abstractWindow);
	}

	public void closeWindow(Class<? extends AbstractWindow> windowClass) {
		if (!windows.containsKey(windowClass))
			return;

		for (Actor actor : Civilization.getInstance().getScreenManager().getCurrentScreen().getOverlayStage()
				.getActors()) {
			if (actor.equals(windows.get(windowClass))) {
				actor.addAction(Actions.removeActor());
				break;
			}
		}

		windows.remove(windowClass);
	}

	public boolean allowsInput(Actor actor) {
		if (allowsInput())
			return true;

		for (AbstractWindow window : windows.values()) {
			if (window.disablesInput())
				for (Actor windowActor : window.getChildren()) {
					if (actor.equals(windowActor)) {
						return true;
					}
				}
			// if (window.disablesInput())
			// return false;
		}

		return false;
	}

	public boolean allowsInput() {
		for (AbstractWindow window : windows.values()) {
			if (window.disablesInput())
				return false;
		}

		return true;
	}

	public boolean isDisabledWindow(AbstractWindow targetWindow) {
		for (AbstractWindow window : windows.values()) {
			if (window.disablesInput() && window.getClass().equals(targetWindow.getClass()))
				return true;
		}
		return false;
	}
}
