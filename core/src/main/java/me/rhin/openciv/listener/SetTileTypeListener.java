package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SetTileTypePacket;

public interface SetTileTypeListener extends Listener {

	public void onSetTileType(SetTileTypePacket packet);

	public static class SetTileTypeEvent extends Event<SetTileTypeListener> {

		private SetTileTypePacket packet;

		public SetTileTypeEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(SetTileTypePacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<SetTileTypeListener> listeners) {
			for (SetTileTypeListener listener : listeners) {
				listener.onSetTileType(packet);
			}
		}

		@Override
		public Class<SetTileTypeListener> getListenerType() {
			return SetTileTypeListener.class;
		}
	}

}
