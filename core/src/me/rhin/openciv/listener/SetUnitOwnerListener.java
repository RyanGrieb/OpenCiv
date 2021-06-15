package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SetUnitOwnerPacket;

public interface SetUnitOwnerListener extends Listener {

	public void onSetUnitOwner(SetUnitOwnerPacket packet);

	public static class SetUnitOwnerEvent extends Event<SetUnitOwnerListener> {

		private SetUnitOwnerPacket packet;

		public SetUnitOwnerEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(SetUnitOwnerPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<SetUnitOwnerListener> listeners) {
			for (SetUnitOwnerListener listener : listeners) {
				listener.onSetUnitOwner(packet);
			}
		}

		@Override
		public Class<SetUnitOwnerListener> getListenerType() {
			return SetUnitOwnerListener.class;
		}
	}

}
