package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SendChatMessagePacket;

public interface SendChatMessageListener extends Listener {

	public void onSentChatMessage(SendChatMessagePacket packet);

	public static class SendChatMessageEvent extends Event<SendChatMessageListener> {

		private SendChatMessagePacket packet;

		public SendChatMessageEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(SendChatMessagePacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<SendChatMessageListener> listeners) {
			for (SendChatMessageListener listener : listeners)
				listener.onSentChatMessage(packet);
		}

		@Override
		public Class<SendChatMessageListener> getListenerType() {
			return SendChatMessageListener.class;
		}

	}
}
