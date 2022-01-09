package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.FaithBuyProductionItemPacket;

public interface FaithBuyProductionItemListener extends Listener {

	public void onFaithBuyProductionItem(WebSocket conn, FaithBuyProductionItemPacket packet);

	public static class FaithBuyProductionItemEvent extends Event<FaithBuyProductionItemListener> {

		private FaithBuyProductionItemPacket packet;
		private WebSocket conn;

		public FaithBuyProductionItemEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(FaithBuyProductionItemPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<FaithBuyProductionItemListener> listeners) {
			for (FaithBuyProductionItemListener listener : listeners) {
				listener.onFaithBuyProductionItem(conn, packet);
			}
		}

		@Override
		public Class<FaithBuyProductionItemListener> getListenerType() {
			return FaithBuyProductionItemListener.class;
		}
	}
}
