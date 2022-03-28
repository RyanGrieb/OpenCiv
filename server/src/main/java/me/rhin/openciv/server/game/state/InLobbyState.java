package me.rhin.openciv.server.game.state;

import org.java_websocket.WebSocket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.GameState;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.civilization.CivType;
import me.rhin.openciv.server.game.civilization.type.RandomCivilization;
import me.rhin.openciv.server.game.options.GameOptionType;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.map.MapSize;
import me.rhin.openciv.shared.packet.type.ChooseCivPacket;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.GetHostPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerDisconnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.SetTurnLengthPacket;
import me.rhin.openciv.shared.packet.type.SetWorldSizePacket;
import me.rhin.openciv.shared.packet.type.StartGameRequestPacket;

public class InLobbyState extends GameState {

	private static final Logger LOGGER = LoggerFactory.getLogger(InLobbyState.class);

	@Override
	public void onStateBegin() {
	}

	@Override
	public void onStateEnd() {
		Server.getInstance().getEventManager().removeListener(this);
	}

	@Override
	public void stop() {
		// Game already stopped
	}

	@EventHandler
	public void onStartGameRequest() {
		onStartGameRequest(null, null);
	}

	@EventHandler
	public void onStartGameRequest(WebSocket conn, StartGameRequestPacket packet) {
		if (conn != null && !getPlayerByConn(conn).isHost())
			return;

		// Assign players with a random civ a civilization
		for (Player rndPlayer : Server.getInstance().getPlayers()) {
			if (rndPlayer.getCiv() instanceof RandomCivilization) {
				// TODO: Set to a random civ not already being played.
				rndPlayer.setCivilization(CivType.randomCiv());

				ChooseCivPacket chooseCivPacket = new ChooseCivPacket();
				chooseCivPacket.setPlayerName(rndPlayer.getName());
				chooseCivPacket.setCivName(rndPlayer.getCiv().getName().toUpperCase());

				Json json = new Json();
				for (Player player : Server.getInstance().getPlayers())
					player.sendPacket(json.toJson(chooseCivPacket));
			}
		}

		Server.getInstance().setGameState(new InGameState());
	}

	@EventHandler
	public void onConnection(WebSocket conn) {
		// FIXME: Check for multiple connections
		Player newPlayer = new Player(conn);

		for (Player player : players) {

			PlayerConnectPacket packet = new PlayerConnectPacket();
			packet.setPlayerName(newPlayer.getName());
			Json json = new Json();
			player.sendPacket(json.toJson(packet));
		}

		players.add(newPlayer);

		if (players.size() < 2) {
			newPlayer.setHost();
		}
	}

	@EventHandler
	public void onDisconnect(WebSocket conn) {
		Player removedPlayer = getPlayerByConn(conn);

		if (removedPlayer == null)
			return;

		Server.getInstance().getEventManager().removeListener(removedPlayer);
		players.remove(removedPlayer);

		for (Player player : players) {

			PlayerDisconnectPacket packet = new PlayerDisconnectPacket();
			packet.setPlayerName(removedPlayer.getName());
			Json json = new Json();
			player.sendPacket(json.toJson(packet));
		}

		// !
		if (players.size() < 1) {
			Server.getInstance().stop();
			return;
		}

		if (removedPlayer.isHost()) {
			Player newHostPlayer = players.get(0);
			newHostPlayer.setHost();

			GetHostPacket packet = new GetHostPacket();
			packet.setPlayerName(newHostPlayer.getName());
			Json json = new Json();
			for (Player player : Server.getInstance().getPlayers())
				player.sendPacket(json.toJson(packet));
		}
	}

	@EventHandler
	public void onPlayerListRequested(WebSocket conn, PlayerListRequestPacket packet) {
		LOGGER.info("[SERVER] Player list requested");
		for (Player player : players) {
			packet.addPlayer(player.getName(), player.getCiv().getName().toUpperCase(), false);
		}
		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	@EventHandler
	public void onPlayerFetch(WebSocket conn, FetchPlayerPacket packet) {
		LOGGER.info("[SERVER] Fetching player...");
		Player player = getPlayerByConn(conn);
		packet.setPlayerName(player.getName());
		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	@EventHandler
	public void onGetHost(WebSocket conn, GetHostPacket packet) {
		for (Player player : Server.getInstance().getPlayers())
			if (player.isHost()) {
				packet.setPlayerName(player.getName());
				Json json = new Json();
				conn.send(json.toJson(packet));
			}
	}

	@EventHandler
	public void onChooseCiv(WebSocket conn, ChooseCivPacket packet) {

		Player packetPlayer = getPlayerByConn(conn);
		packet.setPlayerName(packetPlayer.getName());
		packetPlayer.setCivilization(CivType.valueOf(packet.getCivName()));

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers())
			player.sendPacket(json.toJson(packet));

	}

	@EventHandler
	public void onSetWorldSize(WebSocket conn, SetWorldSizePacket packet) {
		int mapSize = packet.getWorldSize();

		if (mapSize < 0)
			mapSize = 0;
		if (mapSize > MapSize.values().length - 1)
			mapSize = MapSize.values().length - 1;

		Server.getInstance().getGameOptions().setOptionValue(GameOptionType.MAP_LENGTH, mapSize);
		// Server.getInstance().getMap().setSize(mapSize);

		packet.setWorldSize(mapSize);

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers())
			player.sendPacket(json.toJson(packet));
	}

	@EventHandler
	public void onSetTurnLength(WebSocket conn, SetTurnLengthPacket packet) {
		int turnLengthOffset = packet.getTurnLengthOffset();
		if (turnLengthOffset < -1)
			turnLengthOffset = -1;

		Server.getInstance().getGameOptions().setOptionValue(GameOptionType.TURN_LENGTH_OFFSET, turnLengthOffset);
		packet.setTurnLengthOffset(turnLengthOffset);

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers())
			player.sendPacket(json.toJson(packet));
	}

	@Override
	public String toString() {
		return "InLobby";
	}
}
