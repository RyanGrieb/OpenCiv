package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SetCityOwnerPacket;

public interface SetCityOwnerListener extends Listener {

	public void onSetCityOwner(SetCityOwnerPacket packet);

	public static class SetCityOwnerEvent extends Event<SetCityOwnerListener> {

		private SetCityOwnerPacket packet;

		public SetCityOwnerEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(SetCityOwnerPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<SetCityOwnerListener> listeners) {
			for (SetCityOwnerListener listener : listeners) {
				listener.onSetCityOwner(packet);
			}
		}

		@Override
		public Class<SetCityOwnerListener> getListenerType() {
			return SetCityOwnerListener.class;
		}
	}

}
