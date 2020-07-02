package me.rhin.openciv.listener;

import java.util.Queue;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;

public interface BuildingConstructedListener extends Listener {

	public void onBuildingConstructed(BuildingConstructedPacket packet);

	public static class BuildingConstructedEvent extends Event<BuildingConstructedListener> {

		private BuildingConstructedPacket packet;

		public BuildingConstructedEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(BuildingConstructedPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(Queue<BuildingConstructedListener> listeners) {
			for (BuildingConstructedListener listener : listeners) {
				listener.onBuildingConstructed(packet);
			}
		}

		@Override
		public Class<BuildingConstructedListener> getListenerType() {
			return BuildingConstructedListener.class;
		}
	}
}
