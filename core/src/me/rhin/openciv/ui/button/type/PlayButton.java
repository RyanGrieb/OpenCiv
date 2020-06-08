package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.screen.ScreenEnum;

public class PlayButton extends Button {

	public PlayButton(int x, int y, int width, int height) {
		super("Play", x, y, width, height);
	}

	@Override
	public void onClick() {
		// FIXME: We should clear the EventManger when we change screens, but doesn't
		// matter right now.
		Civilization.getInstance().getScreenManager().setScreen(ScreenEnum.IN_GAME);
	}

}
