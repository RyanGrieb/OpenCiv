package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SetWorldSizePacket;

public interface SetWorldSizeListener extends Listener {

	public void onSetWorldSize(WebSocket conn, SetWorldSizePacket packet);

	public static class SetWorldSizeEvent extends Event<SetWorldSizeListener> {

		private SetWorldSizePacket packet;
		private WebSocket conn;

		public SetWorldSizeEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(SetWorldSizePacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<SetWorldSizeListener> listeners) {
			for (SetWorldSizeListener listener : listeners) {
				listener.onSetWorldSize(conn, packet);
			}
		}

		@Override
		public Class<SetWorldSizeListener> getListenerType() {
			return SetWorldSizeListener.class;
		}

	}

}
