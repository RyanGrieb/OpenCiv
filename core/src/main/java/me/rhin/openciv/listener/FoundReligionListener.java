package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.FoundReligionPacket;

public interface FoundReligionListener extends Listener {

	public void onFoundReligion(FoundReligionPacket packet);

	public static class FoundReligionEvent extends Event<FoundReligionListener> {

		private FoundReligionPacket packet;

		public FoundReligionEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(FoundReligionPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<FoundReligionListener> listeners) {
			for (FoundReligionListener listener : listeners) {
				listener.onFoundReligion(packet);
			}
		}

		@Override
		public Class<FoundReligionListener> getListenerType() {
			return FoundReligionListener.class;
		}
	}

}
