package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;

public interface SetProductionItemListener extends Listener {

	public void onSetProductionItem(WebSocket conn, SetProductionItemPacket packet);

	public static class SetProductionItemEvent extends Event<SetProductionItemListener> {

		private SetProductionItemPacket packet;
		private WebSocket conn;

		public SetProductionItemEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(SetProductionItemPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<SetProductionItemListener> listeners) {
			for (SetProductionItemListener listener : listeners) {
				listener.onSetProductionItem(conn, packet);
			}
		}

		@Override
		public Class<SetProductionItemListener> getListenerType() {
			return SetProductionItemListener.class;
		}
	}
}
