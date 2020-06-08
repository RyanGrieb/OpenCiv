package me.rhin.openciv.ui.screen.type;

import java.util.ArrayList;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.LeftClickListener.LeftClickEvent;
import me.rhin.openciv.listener.MouseMoveListener.MouseMoveEvent;
import me.rhin.openciv.listener.PlayerConnectListener;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.ui.button.ButtonManager;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.AbstractScreen;

public class ServerLobbyScreen extends AbstractScreen implements PlayerConnectListener {

	private EventManager eventManager;
	private ButtonManager buttonManager;

	private CustomLabel connectedPlayersTitleLabel;
	private ArrayList<CustomLabel> connectedPlayersLabels;

	public ServerLobbyScreen() {
		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearEvents();
		eventManager.addListener(PlayerConnectListener.class, this);

		this.buttonManager = new ButtonManager(this);

		connectedPlayersLabels = new ArrayList<>();

		connectedPlayersTitleLabel = new CustomLabel("Connected Players: ", 0, Gdx.graphics.getHeight() / 1.1F,
				Gdx.graphics.getWidth(), 20);
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

		Civilization.getInstance().getEventManager().fireEvent(MouseMoveEvent.INSTANCE);
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

		CustomLabel playerLabel = new CustomLabel("Player", 0,
				Gdx.graphics.getHeight() - 100 - (connectedPlayersLabels.size() * 40), Gdx.graphics.getWidth(), 20);
		playerLabel.setAlignment(Align.center);
		stage.addActor(playerLabel);
		connectedPlayersLabels.add(playerLabel);
	}

	private void requestPlayerList() {
		// TODO: Request list of players from the server.
		//Match our connection /w the other list of players to find ourselfs.
	}

}
