package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.screen.type.ServerSelectScreen;

public class ConnectServerButton extends Button {

	private ServerSelectScreen screen;

	public ConnectServerButton(ServerSelectScreen screen, int x, int y, int width, int height) {
		super("Connect", x, y, width, height);
		this.screen = screen;
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getNetworkManager().connect(screen.getIPTextField().getText());
	}
}
