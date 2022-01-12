package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.DiscoveredPlayerPacket;

public interface DiscoveredPlayerListener extends Listener {

	public void onDiscoverPlayer(DiscoveredPlayerPacket packet);

	public static class DiscoveredPlayerEvent extends Event<DiscoveredPlayerListener> {

		private DiscoveredPlayerPacket packet;

		public DiscoveredPlayerEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(DiscoveredPlayerPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<DiscoveredPlayerListener> listeners) {
			for (DiscoveredPlayerListener listener : listeners)
				listener.onDiscoverPlayer(packet);
		}

		@Override
		public Class<DiscoveredPlayerListener> getListenerType() {
			return DiscoveredPlayerListener.class;
		}

	}

}
