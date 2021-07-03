package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.ChooseCivPacket;

public interface ChooseCivListener extends Listener {

	public void onChooseCiv(ChooseCivPacket packet);

	public static class ChooseCivEvent extends Event<ChooseCivListener> {

		private ChooseCivPacket packet;

		public ChooseCivEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(ChooseCivPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<ChooseCivListener> listeners) {
			for (ChooseCivListener listener : listeners) {
				listener.onChooseCiv(packet);
			}
		}

		@Override
		public Class<ChooseCivListener> getListenerType() {
			return ChooseCivListener.class;
		}
	}
}