package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CloseWindowButton extends Button {

	private Class<? extends AbstractWindow> windowClass;

	public CloseWindowButton(Class<? extends AbstractWindow> windowClass, String name, float x, float y, float width,
			float height) {
		super(name, x, y, width, height);

		this.windowClass = windowClass;
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getWindowManager().closeWindow(windowClass);
	}
}