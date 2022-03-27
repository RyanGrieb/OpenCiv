package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.ui.button.AbstractButton;
import me.rhin.openciv.ui.screen.type.ServerSelectScreen;

public class ConnectServerButton extends AbstractButton implements Listener {

	private ServerSelectScreen screen;
	private boolean connecting;

	public ConnectServerButton(ServerSelectScreen screen, float x, float y, float width, float height) {
		super("Connect", x, y, width, height);
		this.screen = screen;

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@Override
	public void onClicked() {
		if (!connecting)
			Civilization.getInstance().getNetworkManager().connect(screen.getIPTextField().getText());
		else {
			Civilization.getInstance().getNetworkManager().disconnect();
			connecting = false;
			setText("Connect");
		}
	}

	@EventHandler
	public void onConnectionFailed() {
		connecting = false;
		setText("Connect");
	}

	@EventHandler
	public void onAttemptedConnection() {
		connecting = true;
		setText("Connecting...");
	}
}
