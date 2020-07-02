package me.rhin.openciv.server.listener;

import java.util.Queue;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;

public interface PlayerListRequestListener extends Listener {

	public void onPlayerListRequested(WebSocket conn, PlayerListRequestPacket packet);

	public static class PlayerListRequestEvent extends Event<PlayerListRequestListener> {

		private PlayerListRequestPacket packet;
		private WebSocket conn;

		public PlayerListRequestEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(PlayerListRequestPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(Queue<PlayerListRequestListener> listeners) {
			for (PlayerListRequestListener listener : listeners) {
				listener.onPlayerListRequested(conn, packet);
			}
		}

		@Override
		public Class<PlayerListRequestListener> getListenerType() {
			return PlayerListRequestListener.class;
		}

	}
}