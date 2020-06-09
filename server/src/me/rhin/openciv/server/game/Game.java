package me.rhin.openciv.server.game;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.listener.ConnectionListener;
import me.rhin.openciv.server.listener.DisconnectListener;
import me.rhin.openciv.server.listener.PlayerListRequestListener;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;

public class Game implements ConnectionListener, DisconnectListener, PlayerListRequestListener {

	private ArrayList<Player> players;
	private boolean started;

	public Game() {
		this.players = new ArrayList<>();
		this.started = false;
	}

	@Override
	public void onConnection(WebSocket conn) {
		// FIXME: Check for multiple connections

		Player newPlayer = new Player(conn);

		for (Player player : players) {
			WebSocket playerConn = player.getConn();

			PlayerConnectPacket packet = new PlayerConnectPacket();
			packet.setPlayerName(newPlayer.getName());
			Json json = new Json();
			playerConn.send(json.toJson(packet));
		}

		players.add(newPlayer);
	}

	@Override
	public void onDisconnect(WebSocket conn) {
		for (Player player : players) {
			if (player.getConn().equals(conn))
				players.remove(player);
		}
	}

	@Override
	public void onPlayerListRequested(WebSocket conn, PlayerListRequestPacket packet) {
		System.out.println("[SERVER] Player list requested");
		for (Player player : players) {
			packet.addPlayer(player.getName());
		}
		Json json = new Json();
		conn.send(json.toJson(packet));
	}

}
