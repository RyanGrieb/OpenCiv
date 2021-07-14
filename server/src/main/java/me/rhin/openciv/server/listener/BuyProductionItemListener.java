package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.BuyProductionItemPacket;

public interface BuyProductionItemListener extends Listener {

	public void onBuyProductionItem(WebSocket conn, BuyProductionItemPacket packet);

	public static class BuyProductionItemEvent extends Event<BuyProductionItemListener> {

		private BuyProductionItemPacket packet;
		private WebSocket conn;

		public BuyProductionItemEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(BuyProductionItemPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<BuyProductionItemListener> listeners) {
			for (BuyProductionItemListener listener : listeners) {
				listener.onBuyProductionItem(conn, packet);
			}
		}

		@Override
		public Class<BuyProductionItemListener> getListenerType() {
			return BuyProductionItemListener.class;
		}
	}
}
