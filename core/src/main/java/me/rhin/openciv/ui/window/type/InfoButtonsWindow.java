package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.OpenChatButton;
import me.rhin.openciv.ui.window.AbstractWindow;

public class InfoButtonsWindow extends AbstractWindow {

	private ColoredBackground background;
	private OpenChatButton chatButton;

	public InfoButtonsWindow() {
		super.setBounds(4, 28, 200, 60);

		// background = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 0, 0,
		// getWidth(), getHeight());
		// addActor(background);

		this.chatButton = new OpenChatButton(0, 0, 42, 42);
		addActor(chatButton);
	}

	@Override
	public boolean disablesInput() {
		return false;
	}

	@Override
	public boolean disablesCameraMovement() {
		return false;
	}

	@Override
	public boolean closesOtherWindows() {
		return false;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return true;
	}

}
