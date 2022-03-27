package me.rhin.openciv.ui.screen.type;

import java.util.ArrayList;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.events.type.LeftClickEvent;
import me.rhin.openciv.game.civilization.CivType;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.logging.Logger;
import me.rhin.openciv.shared.logging.LoggerFactory;
import me.rhin.openciv.shared.logging.LoggerType;
import me.rhin.openciv.shared.packet.type.ChooseCivPacket;
import me.rhin.openciv.shared.packet.type.GameStartPacket;
import me.rhin.openciv.shared.packet.type.GetHostPacket;
import me.rhin.openciv.shared.packet.type.MapRequestPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerDisconnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.StartGameRequestPacket;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.button.type.OpenChatButton;
import me.rhin.openciv.ui.game.GameOptionsMenu;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.ListObject;
import me.rhin.openciv.ui.list.type.ListLobbyPlayer;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.screen.ScreenEnum;
import me.rhin.openciv.ui.window.type.TitleOverlay;

public class ServerLobbyScreen extends AbstractScreen implements Listener {

	private static final Logger LOGGER = LoggerFactory.getInstance(LoggerType.LOG_TAG);

	private EventManager eventManager;
	private TitleOverlay titleOverlay;

	private String playerName;
	private String hostPlayerName;
	private ContainerList playerContainerList;
	private GameOptionsMenu gameOptionsMenu;
	private CustomButton multiplayerStartButton;
	private CustomButton backButton;
	private OpenChatButton chatButton;

	public ServerLobbyScreen() {
		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearListeners();

		this.titleOverlay = new TitleOverlay();
		stage.addActor(titleOverlay);

		this.playerContainerList = new ContainerList(viewport.getWorldWidth() / 2 - 220 / 2,
				viewport.getWorldHeight() - 360, 220, 300);

		stage.addActor(playerContainerList);

		multiplayerStartButton = new CustomButton("Start Game", viewport.getWorldWidth() / 2 - 150 / 2, 60, 150, 45);
		multiplayerStartButton.onClick(() -> {
			Civilization.getInstance().getNetworkManager().sendPacket(new StartGameRequestPacket());
		});

		gameOptionsMenu = new GameOptionsMenu(viewport.getWorldWidth() / 2 + 120, viewport.getWorldHeight() - 360, 200,
				300);

		backButton = new CustomButton("Back", viewport.getWorldWidth() / 2 - 150 / 2, 20, 150, 45);
		backButton.onClick(() -> {
			Civilization.getInstance().getScreenManager().revertToPreviousScreen();
			Civilization.getInstance().getNetworkManager().disconnect();
		});
		stage.addActor(backButton);

		chatButton = new OpenChatButton(4, 28, 42, 42);
		stage.addActor(chatButton);

		requestPlayerList();

		eventManager.addListener(this);
	}

	@Override
	public void show() {
		super.show();
	}

	@EventHandler
	public void onResize(int width, int height) {
		titleOverlay.setSize(width, height);
		playerContainerList.setPosition(width / 2 - 220 / 2, height - 360);
		multiplayerStartButton.setPosition(width / 2 - 150 / 2, 60);
		gameOptionsMenu.setPosition(width / 2 + 120, height - 360);
		backButton.setPosition(width / 2 - 150 / 2, 20);
		gameOptionsMenu.setPosition(width / 2 + 120, height - 360);
	}

	@Override
	public void dispose() {
		super.dispose();

		playerContainerList.onClose();
	}

	@Override
	public boolean touchUp(int screenX, int screenY, int pointer, int button) {
		if (button == Input.Buttons.LEFT) {
			eventManager.fireEvent(new LeftClickEvent(screenX, screenY));
		}
		return false;
	}

	@EventHandler
	public void onPlayerConnect(PlayerConnectPacket packet) {
		LOGGER.info(packet.getPlayerName() + " has connected to the lobby");

		playerContainerList.addItem(ListContainerType.CATEGORY, "Players",
				new ListLobbyPlayer(packet.getPlayerName(), CivType.RANDOM, playerContainerList, 200, 40));
	}

	@EventHandler
	public void onPlayerListRequested(PlayerListRequestPacket packet) {
		for (int i = 0; i < packet.getPlayerList().length; i++) {
			String playerName = packet.getPlayerList()[i];
			if (playerName == null)
				continue;

			playerContainerList.addItem(ListContainerType.CATEGORY, "Players", new ListLobbyPlayer(playerName,
					CivType.valueOf(packet.getCivList()[i]), playerContainerList, 200, 40));
		}

		ArrayList<ListObject> listItemActors = playerContainerList.getListContainers().get("Players")
				.getListItemActors();

		// FIXME: This is fucking stupid. Send a packet to the player telling them who
		// they are?
		this.playerName = listItemActors.get(listItemActors.size() - 1).getKey();
	}

	@EventHandler
	public void onPlayerDisconnect(PlayerDisconnectPacket packet) {
		playerContainerList.removeItem("Players", packet.getPlayerName());

	}

	@EventHandler
	public void onGameStart(GameStartPacket packet) {
		Gdx.app.postRunnable(new Runnable() {
			public void run() {
				Civilization.getInstance().getScreenManager().setScreen(ScreenEnum.IN_GAME);
				Civilization.getInstance().getNetworkManager().sendPacket(new MapRequestPacket());
			}
		});
	}

	@EventHandler
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

	@EventHandler
	public void onChooseCiv(ChooseCivPacket packet) {
		ArrayList<ListObject> listItemActors = playerContainerList.getListContainers().get("Players")
				.getListItemActors();
		for (ListObject listObj : listItemActors) {
			ListLobbyPlayer listPlayer = (ListLobbyPlayer) listObj;
			if (listPlayer.getPlayerName().equals(packet.getPlayerName())) {
				listPlayer.setCivilization(CivType.valueOf(packet.getCivName()));
			}
		}
	}

	public String getPlayerName() {
		return playerName;
	}

	private void requestPlayerList() {
		Civilization.getInstance().getNetworkManager().sendPacket(new PlayerListRequestPacket());
		Civilization.getInstance().getNetworkManager().sendPacket(new GetHostPacket());
	}

	private void assignToLobbyLeader() {
		stage.addActor(multiplayerStartButton);
		stage.addActor(gameOptionsMenu);
	}
}
