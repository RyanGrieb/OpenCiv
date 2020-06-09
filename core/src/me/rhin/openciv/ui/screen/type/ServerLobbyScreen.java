package me.rhin.openciv.ui.screen.type;

import java.util.ArrayList;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.LeftClickListener.LeftClickEvent;
import me.rhin.openciv.listener.MouseMoveListener.MouseMoveEvent;
import me.rhin.openciv.listener.PlayerConnectListener;
import me.rhin.openciv.listener.PlayerListRequestListener;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.ui.button.ButtonManager;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.AbstractScreen;

public class ServerLobbyScreen extends AbstractScreen implements PlayerConnectListener, PlayerListRequestListener {

	private EventManager eventManager;
	private ButtonManager buttonManager;

	private CustomLabel connectedPlayersTitleLabel;
	private ArrayList<CustomLabel> connectedPlayersLabels;

	public ServerLobbyScreen() {
		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearEvents();
		eventManager.addListener(PlayerConnectListener.class, this);
		eventManager.addListener(PlayerListRequestListener.class, this);

		this.buttonManager = new ButtonManager(this);

		connectedPlayersLabels = new ArrayList<>();

		connectedPlayersTitleLabel = new CustomLabel("Connected Players: ", 0, viewport.getWorldHeight() / 1.1F,
				viewport.getWorldWidth(), 20);
		connectedPlayersTitleLabel.setAlignment(Align.center);
		stage.addActor(connectedPlayersTitleLabel);

		requestPlayerList();
	}

	@Override
	public void show() {
		super.show();
	}

	@Override
	public void render(float delta) {
		super.render(delta);

		eventManager.fireEvent(MouseMoveEvent.INSTANCE);
	}

	@Override
	public boolean touchUp(int screenX, int screenY, int pointer, int button) {
		if (button == Input.Buttons.LEFT) {
			eventManager.fireEvent(new LeftClickEvent(screenX, screenY));
		}
		return true;

	}

	@Override
	public void onPlayerConnect(PlayerConnectPacket packet) {
		Gdx.app.log(Civilization.LOG_TAG, packet.getPlayerName() + " has connected to the lobby");

		CustomLabel playerLabel = new CustomLabel(packet.getPlayerName(), 0,
				viewport.getWorldHeight() - 100 - (connectedPlayersLabels.size() * 40), viewport.getWorldWidth(), 20);
		playerLabel.setAlignment(Align.center);
		stage.addActor(playerLabel);
		connectedPlayersLabels.add(playerLabel);
	}

	@Override
	public void onPlayerListRequested(PlayerListRequestPacket packet) {
		System.out.println("Got player list.");
		for (String playerName : packet.getPlayerList()) {
			if (playerName == null)
				continue;

			CustomLabel playerLabel = new CustomLabel(playerName, 0,
					viewport.getWorldHeight() - 100 - (connectedPlayersLabels.size() * 40), viewport.getWorldWidth(),
					20);
			playerLabel.setAlignment(Align.center);
			stage.addActor(playerLabel);
			connectedPlayersLabels.add(playerLabel);
		}
	}

	private void requestPlayerList() {
		Civilization.getInstance().getNetworkManager().sendPacket(new PlayerListRequestPacket());
	}

}
