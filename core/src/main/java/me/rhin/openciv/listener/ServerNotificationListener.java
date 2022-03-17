package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.ServerNotificationPacket;

public interface ServerNotificationListener extends Listener {

	public void onServerNotification(ServerNotificationPacket packet);

	public static class ServerNotificationEvent extends Event<ServerNotificationListener> {

		private ServerNotificationPacket packet;

		public ServerNotificationEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(ServerNotificationPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<ServerNotificationListener> listeners) {
			for (ServerNotificationListener listener : listeners) {
				listener.onServerNotification(packet);
			}
		}

		@Override
		public Class<ServerNotificationListener> getListenerType() {
			return ServerNotificationListener.class;
		}
	}

}
