package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.screen.ScreenEnum;

public class MultiplayerButton extends Button {
	public MultiplayerButton(float x, float y, float width, float height) {
		super("Multiplayer", x, y, width, height);
	}

	@Override
	public void onClick() {
		// FIXME: We should clear the EventManger when we change screens, but doesn't
		// matter right now.
		Civilization.getInstance().getScreenManager().setScreen(ScreenEnum.SERVER_SELECT);
	}
}
