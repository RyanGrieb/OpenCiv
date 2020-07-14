package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SetWorkedTilePacket;

public interface SetWorkedTileListener extends Listener {

	public void onSetWorkedTile(SetWorkedTilePacket packet);

	public static class SetWorkedTileEvent extends Event<SetWorkedTileListener> {

		private SetWorkedTilePacket packet;

		public SetWorkedTileEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(SetWorkedTilePacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<SetWorkedTileListener> listeners) {
			for (SetWorkedTileListener listener : listeners) {
				listener.onSetWorkedTile(packet);
			}
		}

		@Override
		public Class<SetWorkedTileListener> getListenerType() {
			return SetWorkedTileListener.class;
		}
	}
}
