package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.RemoveSpecialistFromContainerPacket;

public interface RemoveSpecialistFromContainerListener extends Listener {

	public void onRemoveSpecialistFromContainer(RemoveSpecialistFromContainerPacket packet);

	public static class RemoveSpecialistFromContainerEvent extends Event<RemoveSpecialistFromContainerListener> {

		private RemoveSpecialistFromContainerPacket packet;

		public RemoveSpecialistFromContainerEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(RemoveSpecialistFromContainerPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<RemoveSpecialistFromContainerListener> listeners) {
			for (RemoveSpecialistFromContainerListener listener : listeners) {
				listener.onRemoveSpecialistFromContainer(packet);
			}
		}

		@Override
		public Class<RemoveSpecialistFromContainerListener> getListenerType() {
			return RemoveSpecialistFromContainerListener.class;
		}
	}

}
