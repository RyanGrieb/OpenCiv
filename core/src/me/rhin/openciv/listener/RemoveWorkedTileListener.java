package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.RemoveWorkedTilePacket;

public interface RemoveWorkedTileListener extends Listener {

	public void onRemoveWorkedTile(RemoveWorkedTilePacket packet);

	public static class RemoveWorkedTileEvent extends Event<RemoveWorkedTileListener> {

		private RemoveWorkedTilePacket packet;

		public RemoveWorkedTileEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(RemoveWorkedTilePacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<RemoveWorkedTileListener> listeners) {
			for (RemoveWorkedTileListener listener : listeners) {
				listener.onRemoveWorkedTile(packet);
			}
		}

		@Override
		public Class<RemoveWorkedTileListener> getListenerType() {
			return RemoveWorkedTileListener.class;
		}
	}

}
