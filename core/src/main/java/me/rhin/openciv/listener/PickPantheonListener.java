package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;

public interface PickPantheonListener extends Listener {

	public void onPickPantheon(PickPantheonPacket packet);

	public static class PickPantheonEvent extends Event<PickPantheonListener> {

		private PickPantheonPacket packet;

		public PickPantheonEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(PickPantheonPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<PickPantheonListener> listeners) {
			for (PickPantheonListener listener : listeners) {
				listener.onPickPantheon(packet);
			}
		}

		@Override
		public Class<PickPantheonListener> getListenerType() {
			return PickPantheonListener.class;
		}
	}

}
