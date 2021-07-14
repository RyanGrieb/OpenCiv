package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.ItemInfoWindow;

public class CancelItemButton extends Button {

	public CancelItemButton(float x, float y, float width, float height) {
		super("Cancel", x, y, width, height);
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getWindowManager().closeWindow(ItemInfoWindow.class);
	}

}
