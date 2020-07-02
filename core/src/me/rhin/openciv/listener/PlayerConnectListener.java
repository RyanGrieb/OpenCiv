package me.rhin.openciv.listener;

import java.util.Queue;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;

public interface PlayerConnectListener extends Listener {

	public void onPlayerConnect(PlayerConnectPacket packet);

	public static class PlayerConnectEvent extends Event<PlayerConnectListener> {

		private PlayerConnectPacket packet;

		public PlayerConnectEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(PlayerConnectPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(Queue<PlayerConnectListener> listeners) {
			for (PlayerConnectListener listener : listeners) {
				listener.onPlayerConnect(packet);
			}
		}

		@Override
		public Class<PlayerConnectListener> getListenerType() {
			return PlayerConnectListener.class;
		}
	}
}
