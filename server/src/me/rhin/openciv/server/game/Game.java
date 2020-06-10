package me.rhin.openciv.server.game;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.game.map.tile.GameMap;
import me.rhin.openciv.server.listener.ConnectionListener;
import me.rhin.openciv.server.listener.DisconnectListener;
import me.rhin.openciv.server.listener.PlayerListRequestListener;
import me.rhin.openciv.shared.packet.type.GameStartPacket;
import me.rhin.openciv.shared.packet.type.MapChunkPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerDisconnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;

public class Game implements ConnectionListener, DisconnectListener, PlayerListRequestListener {

	private GameMap map;
	private ArrayList<Player> players;
	private boolean started;

	public Game() {
		this.map = new GameMap(this);
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
		Player removedPlayer = getPlayerByConn(conn);

		if (removedPlayer == null)
			return;

		players.remove(removedPlayer);

		for (Player player : players) {
			WebSocket playerConn = player.getConn();

			PlayerDisconnectPacket packet = new PlayerDisconnectPacket();
			packet.setPlayerName(removedPlayer.getName());
			Json json = new Json();
			playerConn.send(json.toJson(packet));
		}
	}

	private Player getPlayerByConn(WebSocket conn) {

		for (Player player : players)
			if (player.getConn().equals(conn))
				return player;

		return null;

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

	public void start() {
		System.out.println("[SERVER] Starting game...");
		map.generateTerrain();

		for (int x = 0; x < GameMap.WIDTH; x++) {
			for (int y = 0; y < GameMap.HEIGHT; y++) {
				if (x % 4 == 0 && y % 4 == 0) {
					MapChunkPacket packet = new MapChunkPacket();
					int[][] tileChunk = new int[MapChunkPacket.CHUNK_SIZE][MapChunkPacket.CHUNK_SIZE];
					for (int i = 0; i < MapChunkPacket.CHUNK_SIZE; i++) {
						for (int j = 0; j < MapChunkPacket.CHUNK_SIZE; j++) {
							int tileX = x + i;
							int tileY = y + j;
							tileChunk[i][j] = map.getTiles()[tileX][tileY].getTileType().getID();
						}
					}
					packet.setTileCunk(tileChunk);
					packet.setChunkLocation(x, y);

					for (Player player : players) {
						// FIXME: Do we NEED to create this Json obj every time?
						Json json = new Json();
						player.getConn().send(json.toJson(packet));
					}
				}
			}
		}

		// After sending out the map chunks, start the game...

		for (Player player : players) {
			Json json = new Json();
			GameStartPacket packet = new GameStartPacket();
			player.getConn().send(json.toJson(packet));
		}
		// FIXME: Don't truly start the game until ALL player finished received the map
		// packets.
		started = true;
	}

	public void stop() {
		System.out.println("[SERVER] Stopping game...");
		started = false;
	}
}
