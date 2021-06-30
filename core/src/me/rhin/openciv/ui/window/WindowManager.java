package me.rhin.openciv.ui.window;

import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map.Entry;

import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.window.type.CityInfoWindow;

public class WindowManager {

	private LinkedHashMap<Class<? extends AbstractWindow>, AbstractWindow> windows;
	private HashMap<Class<? extends AbstractWindow>, AbstractWindow> hiddenGameDisplayWindows;

	public WindowManager() {
		this.windows = new LinkedHashMap<>();
		this.hiddenGameDisplayWindows = new HashMap<>();
	}

	public void addWindow(AbstractWindow abstractWindow) {

		if (abstractWindow.closesOtherWindows()) {
			for (AbstractWindow window : new HashMap<>(windows).values()) {

				if (!abstractWindow.closesGameDisplayWindows() && window.isGameDisplayWindow())
					continue;

				closeWindow(window.getClass());
			}
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
			for (AbstractWindow window : new HashMap<>(windows).values()) {

				if (!abstractWindow.closesGameDisplayWindows() && window.isGameDisplayWindow())
					continue;

				closeWindow(window.getClass());
			}
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
				windows.get(windowClass).onClose();
				break;
			}
		}

		if (windows.get(windowClass).isGameDisplayWindow()) {
			// FIXME: I don't believe we properly hide game display windows. Use
			// setVisible() instead of removing shit.
			hiddenGameDisplayWindows.put(windowClass, windows.get(windowClass));
		}

		if (windows.get(windowClass).closesOtherWindows()) {

			Iterator<Entry<Class<? extends AbstractWindow>, AbstractWindow>> hiddenGameDisplayWindowsIter = hiddenGameDisplayWindows
					.entrySet().iterator();

			while (hiddenGameDisplayWindowsIter.hasNext()) {

				Entry<Class<? extends AbstractWindow>, AbstractWindow> hiddenGameWindow = hiddenGameDisplayWindowsIter
						.next();

				Civilization.getInstance().getScreenManager().getCurrentScreen().getOverlayStage()
						.addActor(hiddenGameWindow.getValue());

				windows.put(hiddenGameWindow.getKey(), hiddenGameWindow.getValue());
				hiddenGameDisplayWindowsIter.remove();
			}
		}

		windows.remove(windowClass);
	}

	public boolean allowsInput(Actor actor) {
		AbstractWindow topWindow = getLastElement(windows.values());

		if (allowsInput() || topWindow == null)
			return true;

		if (topWindow.disablesInput() && actor.getParent().equals(topWindow))
			return true;

		return false;
	}

	public boolean allowsInput() {
		for (AbstractWindow window : windows.values()) {
			if (window.disablesInput())
				return false;
		}

		return true;
	}

	public boolean allowsCameraMovement() {
		for (AbstractWindow window : windows.values()) {
			if (window.disablesCameraMovement())
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

	public boolean isOpenWindow(Class<CityInfoWindow> windowClass) {
		return windows.containsKey(windowClass);
	}

	// FIXME: Move to util class?
	private <T> T getLastElement(final Iterable<T> elements) {
		T lastElement = null;

		for (T element : elements) {
			lastElement = element;
		}

		return lastElement;
	}
}
