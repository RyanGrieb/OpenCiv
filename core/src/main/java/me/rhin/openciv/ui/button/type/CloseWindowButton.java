package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.button.AbstractButton;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CloseWindowButton extends AbstractButton {

	private Class<? extends AbstractWindow> windowClass;

	public CloseWindowButton(Class<? extends AbstractWindow> windowClass, String name, float x, float y, float width,
			float height) {
		super(name, x, y, width, height);

		this.windowClass = windowClass;
	}

	public CloseWindowButton(Class<? extends AbstractWindow> windowClass, TextureEnum iconTexture, float x, float y,
			int width, int height) {
		super(TextureEnum.UI_BUTTON_ICON, TextureEnum.UI_BUTTON_ICON_HOVERED, iconTexture, x, y, width, height);
		this.windowClass = windowClass;
	}

	@Override
	public void onClicked() {
		Civilization.getInstance().getWindowManager().closeWindow(windowClass);
	}
}