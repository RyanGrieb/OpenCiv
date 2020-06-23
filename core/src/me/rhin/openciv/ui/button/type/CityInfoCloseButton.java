package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.CityInfoWindow;

public class CityInfoCloseButton extends Button {

	public CityInfoCloseButton(float x, float y, float width, float height) {
		super("Close", x, y, width, height);
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getWindowManager().closeWindow(CityInfoWindow.class);
	}

}
