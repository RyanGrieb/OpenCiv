package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.PlayerDisconnectPacket;

public interface PlayerDisconnectListener extends Listener {

	public void onPlayerDisconnect(PlayerDisconnectPacket packet);

	public static class PlayerDisconnectEvent extends Event<PlayerDisconnectListener> {

		private PlayerDisconnectPacket packet;

		public PlayerDisconnectEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(PlayerDisconnectPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<PlayerDisconnectListener> listeners) {
			for (PlayerDisconnectListener listener : listeners) {
				listener.onPlayerDisconnect(packet);
			}
		}

		@Override
		public Class<PlayerDisconnectListener> getListenerType() {
			return PlayerDisconnectListener.class;
		}

	}
}
