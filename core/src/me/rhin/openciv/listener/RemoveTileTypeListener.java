package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.RemoveTileTypePacket;

public interface RemoveTileTypeListener extends Listener {

	public void onRemoveTileType(RemoveTileTypePacket packet);

	public static class RemoveTileTypeEvent extends Event<RemoveTileTypeListener> {

		private RemoveTileTypePacket packet;

		public RemoveTileTypeEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(RemoveTileTypePacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<RemoveTileTypeListener> listeners) {
			for (RemoveTileTypeListener listener : listeners) {
				listener.onRemoveTileType(packet);
			}
		}

		@Override
		public Class<RemoveTileTypeListener> getListenerType() {
			return RemoveTileTypeListener.class;
		}
	}

}
