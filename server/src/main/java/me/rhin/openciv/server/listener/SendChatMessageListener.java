package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SendChatMessagePacket;

public interface SendChatMessageListener extends Listener {

	public void onSendChatMessage(WebSocket conn, SendChatMessagePacket packet);

	public static class SendChatMessageEvent extends Event<SendChatMessageListener> {

		private SendChatMessagePacket packet;
		private WebSocket conn;

		public SendChatMessageEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(SendChatMessagePacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<SendChatMessageListener> listeners) {
			for (SendChatMessageListener listener : listeners) {
				listener.onSendChatMessage(conn, packet);
			}
		}

		@Override
		public Class<SendChatMessageListener> getListenerType() {
			return SendChatMessageListener.class;
		}

	}

}
