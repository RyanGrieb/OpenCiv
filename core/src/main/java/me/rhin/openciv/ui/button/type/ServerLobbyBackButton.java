package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;

public class ServerLobbyBackButton extends PreviousScreenButton {

	public ServerLobbyBackButton(float x, float y, float width, float height) {
		super(x, y, width, height);
	}

	@Override
	public void onClick() {
		super.onClick();
		Civilization.getInstance().getNetworkManager().disconnect();
	}
}
