package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;

public interface AddUnitListener extends Listener {

	public void onUnitAdd(AddUnitPacket packet);

	public static class AddUnitEvent extends Event<AddUnitListener> {

		private AddUnitPacket packet;

		public AddUnitEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(AddUnitPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<AddUnitListener> listeners) {
			for (AddUnitListener listener : listeners) {
				listener.onUnitAdd(packet);
			}
		}

		@Override
		public Class<AddUnitListener> getListenerType() {
			return AddUnitListener.class;
		}
	}
}
