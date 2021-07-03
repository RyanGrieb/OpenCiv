package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SetCityHealthPacket;

public interface SetCityHealthListener extends Listener {

	public void onSetCityHealth(SetCityHealthPacket packet);

	public static class SetCityHealthEvent extends Event<SetCityHealthListener> {

		private SetCityHealthPacket packet;

		public SetCityHealthEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(SetCityHealthPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<SetCityHealthListener> listeners) {
			for (SetCityHealthListener listener : listeners) {
				listener.onSetCityHealth(packet);
			}
		}

		@Override
		public Class<SetCityHealthListener> getListenerType() {
			return SetCityHealthListener.class;
		}
	}

}
