package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.NextTurnButton;
import me.rhin.openciv.ui.button.type.WaitingNextTurnButton;
import me.rhin.openciv.ui.window.AbstractWindow;

public class NextTurnWindow extends AbstractWindow {

	private ColoredBackground background;
	private NextTurnButton nextTurnButton;
	private WaitingNextTurnButton cancelNextTurnButton;

	public NextTurnWindow() {
		super.setBounds(viewport.getWorldWidth() / 2 - 200 / 2, 0, 200, 125);

		this.background = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 0, 0, getWidth(), getHeight());
		addActor(background);
		
		
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
