package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.AddSpecialistToContainerPacket;

public interface AddSpecialistToContainerListener extends Listener {

	public void onAddSpecialistToContainer(AddSpecialistToContainerPacket packet);

	public static class AddSpecialistToContainerEvent extends Event<AddSpecialistToContainerListener> {

		private AddSpecialistToContainerPacket packet;

		public AddSpecialistToContainerEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(AddSpecialistToContainerPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<AddSpecialistToContainerListener> listeners) {
			for (AddSpecialistToContainerListener listener : listeners) {
				listener.onAddSpecialistToContainer(packet);
			}
		}

		@Override
		public Class<AddSpecialistToContainerListener> getListenerType() {
			return AddSpecialistToContainerListener.class;
		}
	}

}
