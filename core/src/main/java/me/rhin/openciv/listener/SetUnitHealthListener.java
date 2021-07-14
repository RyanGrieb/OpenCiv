package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SetUnitHealthPacket;

public interface SetUnitHealthListener extends Listener {

	public void onSetUnitHealth(SetUnitHealthPacket packet);

	public static class SetUnitHealthEvent extends Event<SetUnitHealthListener> {

		private SetUnitHealthPacket packet;

		public SetUnitHealthEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(SetUnitHealthPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<SetUnitHealthListener> listeners) {
			for (SetUnitHealthListener listener : listeners) {
				listener.onSetUnitHealth(packet);
			}
		}

		@Override
		public Class<SetUnitHealthListener> getListenerType() {
			return SetUnitHealthListener.class;
		}
	}

}
