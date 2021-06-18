package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;

public interface WorkTileListener extends Listener {

	public void onWorkTile(WorkTilePacket packet);

	public static class WorkTileEvent extends Event<WorkTileListener> {

		private WorkTilePacket packet;

		public WorkTileEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(WorkTilePacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<WorkTileListener> listeners) {
			for (WorkTileListener listener : listeners) {
				listener.onWorkTile(packet);
			}
		}

		@Override
		public Class<WorkTileListener> getListenerType() {
			return WorkTileListener.class;
		}
	}

}
