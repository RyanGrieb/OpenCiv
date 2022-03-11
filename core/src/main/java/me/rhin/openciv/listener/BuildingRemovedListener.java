package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.BuildingRemovedPacket;

public interface BuildingRemovedListener extends Listener {

	public void onBuildingRemoved(BuildingRemovedPacket packet);

	public static class BuildingRemovedEvent extends Event<BuildingRemovedListener> {

		private BuildingRemovedPacket packet;

		public BuildingRemovedEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(BuildingRemovedPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<BuildingRemovedListener> listeners) {
			for (BuildingRemovedListener listener : listeners) {
				listener.onBuildingRemoved(packet);
			}
		}

		@Override
		public Class<BuildingRemovedListener> getListenerType() {
			return BuildingRemovedListener.class;
		}
	}

}
