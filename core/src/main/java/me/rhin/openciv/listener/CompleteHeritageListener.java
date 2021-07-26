package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.CompleteHeritagePacket;

public interface CompleteHeritageListener extends Listener {

	public void onCompleteHeritage(CompleteHeritagePacket packet);

	public static class CompleteHeritageEvent extends Event<CompleteHeritageListener> {

		private CompleteHeritagePacket packet;

		public CompleteHeritageEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(CompleteHeritagePacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<CompleteHeritageListener> listeners) {
			for (CompleteHeritageListener listener : listeners) {
				listener.onCompleteHeritage(packet);
			}
		}

		@Override
		public Class<CompleteHeritageListener> getListenerType() {
			return CompleteHeritageListener.class;
		}
	}

}
