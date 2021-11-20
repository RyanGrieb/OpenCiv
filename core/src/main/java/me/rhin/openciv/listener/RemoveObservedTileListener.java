package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.RemoveObservedTilePacket;

public interface RemoveObservedTileListener extends Listener {

	public void onRemoveObservedTile(RemoveObservedTilePacket packet);

	public static class RemoveObservedTileEvent extends Event<RemoveObservedTileListener> {

		private RemoveObservedTilePacket packet;

		public RemoveObservedTileEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(RemoveObservedTilePacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<RemoveObservedTileListener> listeners) {
			for (RemoveObservedTileListener listener : listeners) {
				listener.onRemoveObservedTile(packet);
			}
		}

		@Override
		public Class<RemoveObservedTileListener> getListenerType() {
			return RemoveObservedTileListener.class;
		}
	}

}
