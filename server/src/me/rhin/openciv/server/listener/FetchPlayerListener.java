package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;

public interface FetchPlayerListener extends Listener {

	public void onPlayerFetch(WebSocket conn, FetchPlayerPacket packet);

	public static class FetchPlayerEvent extends Event<FetchPlayerListener> {

		private FetchPlayerPacket packet;
		private WebSocket conn;

		public FetchPlayerEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(FetchPlayerPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<FetchPlayerListener> listeners) {
			for (FetchPlayerListener listener : listeners) {
				listener.onPlayerFetch(conn, packet);
			}
		}

		@Override
		public Class<FetchPlayerListener> getListenerType() {
			return FetchPlayerListener.class;
		}

	}

}
