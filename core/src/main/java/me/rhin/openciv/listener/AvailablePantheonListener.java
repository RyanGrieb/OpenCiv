package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.AvailablePantheonPacket;

public interface AvailablePantheonListener extends Listener {

	public void onAvailablePantheon(AvailablePantheonPacket packet);

	public static class AvailablePantheonEvent extends Event<AvailablePantheonListener> {

		private AvailablePantheonPacket packet;

		public AvailablePantheonEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(AvailablePantheonPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<AvailablePantheonListener> listeners) {
			for (AvailablePantheonListener listener : listeners) {
				listener.onAvailablePantheon(packet);
			}
		}

		@Override
		public Class<AvailablePantheonListener> getListenerType() {
			return AvailablePantheonListener.class;
		}
	}
	
}
