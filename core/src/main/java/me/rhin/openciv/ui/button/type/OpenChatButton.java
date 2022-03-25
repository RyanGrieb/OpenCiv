package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.button.AbstractButton;
import me.rhin.openciv.ui.window.type.ChatboxWindow;

public class OpenChatButton extends AbstractButton {

	public OpenChatButton(float x, float y, float width, float height) {
		super(TextureEnum.UI_BUTTON_ICON, TextureEnum.UI_BUTTON_ICON_HOVERED, TextureEnum.ICON_CHAT, x, y, width,
				height);
	}

	@Override
	public void onClicked() {
		Civilization.getInstance().getWindowManager().toggleWindow(new ChatboxWindow());
	}

}
