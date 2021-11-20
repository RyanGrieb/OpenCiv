package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.AddObservedTilePacket;

public interface AddObservedTileListener extends Listener {

	public void onAddObservedTile(AddObservedTilePacket packet);

	public static class AddObservedTileEvent extends Event<AddObservedTileListener> {

		private AddObservedTilePacket packet;

		public AddObservedTileEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(AddObservedTilePacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<AddObservedTileListener> listeners) {
			for (AddObservedTileListener listener : listeners) {
				listener.onAddObservedTile(packet);
			}
		}

		@Override
		public Class<AddObservedTileListener> getListenerType() {
			return AddObservedTileListener.class;
		}
	}

}
