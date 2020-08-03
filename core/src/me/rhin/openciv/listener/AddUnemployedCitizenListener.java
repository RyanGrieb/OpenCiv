package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.AddUnemployedCitizenPacket;

public interface AddUnemployedCitizenListener extends Listener {

	public void onAddUnemployedCitizen(AddUnemployedCitizenPacket packet);

	public static class AddUnemployedCitizenEvent extends Event<AddUnemployedCitizenListener> {

		private AddUnemployedCitizenPacket packet;

		public AddUnemployedCitizenEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(AddUnemployedCitizenPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<AddUnemployedCitizenListener> listeners) {
			for (AddUnemployedCitizenListener listener : listeners) {
				listener.onAddUnemployedCitizen(packet);
			}
		}

		@Override
		public Class<AddUnemployedCitizenListener> getListenerType() {
			return AddUnemployedCitizenListener.class;
		}
	}
}
