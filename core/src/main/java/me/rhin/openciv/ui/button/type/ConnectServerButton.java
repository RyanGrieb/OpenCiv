package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.AttemptConnectionListener;
import me.rhin.openciv.listener.ConnectionFailedListener;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.screen.type.ServerSelectScreen;

public class ConnectServerButton extends Button implements AttemptConnectionListener, ConnectionFailedListener {

	private ServerSelectScreen screen;
	private boolean connecting;

	public ConnectServerButton(ServerSelectScreen screen, float x, float y, float width, float height) {
		super("Connect", x, y, width, height);
		this.screen = screen;

		Civilization.getInstance().getEventManager().addListener(AttemptConnectionListener.class, this);
		Civilization.getInstance().getEventManager().addListener(ConnectionFailedListener.class, this);
	}

	@Override
	public void onClick() {
		if (!connecting)
			Civilization.getInstance().getNetworkManager().connect(screen.getIPTextField().getText());
		else {
			Civilization.getInstance().getNetworkManager().disconnect();
			connecting = false;
			setText("Connect");
		}
	}

	@Override
	public void onConnectionFailed() {
		connecting = false;
		setText("Connect");
	}

	@Override
	public void onAttemptedConnection() {
		connecting = true;
		setText("Connecting...");
	}
}
