package me.rhin.openciv.listener;

import java.util.Queue;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;

public interface PlayerStatUpdateListener extends Listener {

	public void onPlayerStatUpdate(PlayerStatUpdatePacket packet);

	public static class PlayerStatUpdateEvent extends Event<PlayerStatUpdateListener> {

		private PlayerStatUpdatePacket packet;

		public PlayerStatUpdateEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(PlayerStatUpdatePacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(Queue<PlayerStatUpdateListener> listeners) {
			for (PlayerStatUpdateListener listener : listeners) {
				listener.onPlayerStatUpdate(packet);
			}
		}

		@Override
		public Class<PlayerStatUpdateListener> getListenerType() {
			return PlayerStatUpdateListener.class;
		}
	}
}
