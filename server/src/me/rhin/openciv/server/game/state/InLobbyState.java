package me.rhin.openciv.server.game.state;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Game;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.listener.ConnectionListener;
import me.rhin.openciv.server.listener.DisconnectListener;
import me.rhin.openciv.server.listener.FetchPlayerListener;
import me.rhin.openciv.server.listener.GetHostListener;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.server.listener.PlayerListRequestListener;
import me.rhin.openciv.server.listener.StartGameRequestListener;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.GetHostPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerDisconnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;

public class InLobbyState extends Game implements StartGameRequestListener, ConnectionListener, DisconnectListener,
		PlayerListRequestListener, FetchPlayerListener, GetHostListener {

	public InLobbyState() {
		Server.getInstance().getEventManager().addListener(StartGameRequestListener.class, this);
		Server.getInstance().getEventManager().addListener(ConnectionListener.class, this);
		Server.getInstance().getEventManager().addListener(DisconnectListener.class, this);
		Server.getInstance().getEventManager().addListener(PlayerListRequestListener.class, this);
		Server.getInstance().getEventManager().addListener(FetchPlayerListener.class, this);
		Server.getInstance().getEventManager().addListener(GetHostListener.class, this);
	}

	@Override
	public void onStateEnd() {
		// FIXME: Single method clearing all listeners from this object.
		Server.getInstance().getEventManager().removeListener(StartGameRequestListener.class, this);
		Server.getInstance().getEventManager().removeListener(ConnectionListener.class, this);
		Server.getInstance().getEventManager().removeListener(DisconnectListener.class, this);
		Server.getInstance().getEventManager().removeListener(PlayerListRequestListener.class, this);
		Server.getInstance().getEventManager().removeListener(FetchPlayerListener.class, this);
		Server.getInstance().getEventManager().addListener(GetHostListener.class, this);
	}

	@Override
	public void stop() {
		// Game already stopped
	}

	@Override
	public void onStartGameRequest(WebSocket conn) {
		if (conn != null && !getPlayerByConn(conn).isHost())
			return;
		Server.getInstance().setGameState(new InGameState());
	}

	@Override
	public void onConnection(WebSocket conn) {
		// FIXME: Check for multiple connections

		Player newPlayer = new Player(conn);

		for (Player player : players) {
			WebSocket playerConn = player.getConn();

			PlayerConnectPacket packet = new PlayerConnectPacket();
			packet.setPlayerName(newPlayer.getName());
			packet.setColor(newPlayer.getColor().toString());
			Json json = new Json();
			playerConn.send(json.toJson(packet));
		}

		players.add(newPlayer);

		if (players.size() < 2) {
			newPlayer.setHost();
		}
	}

	@Override
	public void onDisconnect(WebSocket conn) {
		Player removedPlayer = getPlayerByConn(conn);

		if (removedPlayer == null)
			return;

		Server.getInstance().getEventManager().removeListener(NextTurnListener.class, removedPlayer);
		players.remove(removedPlayer);

		for (Player player : players) {
			WebSocket playerConn = player.getConn();

			PlayerDisconnectPacket packet = new PlayerDisconnectPacket();
			packet.setPlayerName(removedPlayer.getName());
			Json json = new Json();
			playerConn.send(json.toJson(packet));
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
				player.getConn().send(json.toJson(packet));
		}
	}

	@Override
	public void onPlayerListRequested(WebSocket conn, PlayerListRequestPacket packet) {
		System.out.println("[SERVER] Player list requested");
		for (Player player : players) {
			packet.addPlayer(player.getName(), player.getColor().toString());
		}
		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	@Override
	public void onPlayerFetch(WebSocket conn, FetchPlayerPacket packet) {
		System.out.println("[SERVER] Fetching player...");
		Player player = getPlayerByConn(conn);
		packet.setPlayerName(player.getName());
		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	@Override
	public void onGetHost(WebSocket conn, GetHostPacket packet) {
		for (Player player : Server.getInstance().getPlayers())
			if (player.isHost()) {
				packet.setPlayerName(player.getName());
				Json json = new Json();
				conn.send(json.toJson(packet));
			}
	}

	@Override
	public String toString() {
		return "InLobby";
	}
}
