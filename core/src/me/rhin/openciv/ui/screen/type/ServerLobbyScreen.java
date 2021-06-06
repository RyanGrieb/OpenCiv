package me.rhin.openciv.ui.screen.type;

import java.util.ArrayList;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.GameStartListener;
import me.rhin.openciv.listener.GetHostListener;
import me.rhin.openciv.listener.LeftClickListener.LeftClickEvent;
import me.rhin.openciv.listener.MouseMoveListener.MouseMoveEvent;
import me.rhin.openciv.listener.PlayerConnectListener;
import me.rhin.openciv.listener.PlayerDisconnectListener;
import me.rhin.openciv.listener.PlayerListRequestListener;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.shared.packet.type.GetHostPacket;
import me.rhin.openciv.shared.packet.type.MapRequestPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerDisconnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.ui.button.type.MPStartButton;
import me.rhin.openciv.ui.button.type.ServerLobbyBackButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.ListObject;
import me.rhin.openciv.ui.list.type.ListLobbyPlayer;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.screen.ScreenEnum;
import me.rhin.openciv.ui.window.type.TitleOverlay;

public class ServerLobbyScreen extends AbstractScreen implements ResizeListener, PlayerConnectListener,
		PlayerDisconnectListener, PlayerListRequestListener, GameStartListener, GetHostListener {

	private EventManager eventManager;
	private TitleOverlay titleOverlay;

	private String playerName;
	private String hostPlayerName;
	private ContainerList playerContainerList;
	private MPStartButton multiplayerStartButton;
	private ServerLobbyBackButton backButton;

	public ServerLobbyScreen() {
		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearEvents();

		this.titleOverlay = new TitleOverlay();
		stage.addActor(titleOverlay);

		this.playerContainerList = new ContainerList(stage, viewport.getWorldWidth() / 2 - 220 / 2,
				viewport.getWorldHeight() - 360, 200, 300);

		stage.addActor(playerContainerList);

		eventManager.addListener(ResizeListener.class, this);
		eventManager.addListener(PlayerConnectListener.class, this);
		eventManager.addListener(PlayerDisconnectListener.class, this);
		eventManager.addListener(PlayerListRequestListener.class, this);
		eventManager.addListener(GameStartListener.class, this);
		eventManager.addListener(GetHostListener.class, this);

		multiplayerStartButton = new MPStartButton(viewport.getWorldWidth() / 2 - 150 / 2, 60, 150, 45);

		backButton = new ServerLobbyBackButton(viewport.getWorldWidth() / 2 - 150 / 2, 20, 150, 45);
		stage.addActor(backButton);

		requestPlayerList();
	}

	@Override
	public void show() {
		super.show();
	}

	@Override
	public void onResize(int width, int height) {
		titleOverlay.setSize(width, height);
		playerContainerList.setPosition(width / 2 - 220 / 2, height - 360);
		multiplayerStartButton.setPosition(width / 2 - 150 / 2, 60);
		backButton.setPosition(width / 2 - 150 / 2, 20);
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
		return false;
	}

	@Override
	public void onPlayerConnect(PlayerConnectPacket packet) {
		Gdx.app.log(Civilization.LOG_TAG, packet.getPlayerName() + " has connected to the lobby");

		playerContainerList.addItem(ListContainerType.CATEGORY, "Players",
				new ListLobbyPlayer(packet.getPlayerName(), 200, 40));
	}

	@Override
	public void onPlayerListRequested(PlayerListRequestPacket packet) {
		for (int i = 0; i < packet.getPlayerList().length; i++) {
			String playerName = packet.getPlayerList()[i];
			if (playerName == null)
				continue;

			playerContainerList.addItem(ListContainerType.CATEGORY, "Players",
					new ListLobbyPlayer(playerName, 200, 40));
		}

		ArrayList<ListObject> listItemActors = playerContainerList.getListContainers().get("Players")
				.getListItemActors();

		// FIXME: This is fucking stupid. Send a packet to the player telling them who
		// they are?
		this.playerName = listItemActors.get(listItemActors.size() - 1).getKey();
	}

	@Override
	public void onPlayerDisconnect(PlayerDisconnectPacket packet) {
		playerContainerList.removeItem("Players", packet.getPlayerName());

	}

	@Override
	public void onGameStart() {
		Gdx.app.postRunnable(new Runnable() {
			public void run() {
				Civilization.getInstance().getScreenManager().setScreen(ScreenEnum.IN_GAME);
				Civilization.getInstance().getNetworkManager().sendPacket(new MapRequestPacket());
			}
		});
	}

	@Override
	public void onGetHost(GetHostPacket packet) {
		hostPlayerName = packet.getPlayer();
		if (playerName.equals(packet.getPlayer()))
			assignToLobbyLeader();

		ArrayList<ListObject> listItemActors = playerContainerList.getListContainers().get("Players")
				.getListItemActors();
		for (ListObject listObj : listItemActors) {
			ListLobbyPlayer listPlayer = (ListLobbyPlayer) listObj;
			if (listPlayer.getPlayerName().equals(hostPlayerName)) {
				listPlayer.setHost();
			}
		}
	}

	@Override
	public ScreenEnum getType() {
		return ScreenEnum.SERVER_LOBBY;
	}

	private void requestPlayerList() {
		Civilization.getInstance().getNetworkManager().sendPacket(new PlayerListRequestPacket());
		Civilization.getInstance().getNetworkManager().sendPacket(new GetHostPacket());
	}

	private void assignToLobbyLeader() {
		stage.addActor(multiplayerStartButton);
	}
}
