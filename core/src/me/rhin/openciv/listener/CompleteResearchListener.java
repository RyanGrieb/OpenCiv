package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;

public interface CompleteResearchListener extends Listener {

	public void onCompleteResearch(CompleteResearchPacket packet);

	public static class CompleteResearchEvent extends Event<CompleteResearchListener> {

		private CompleteResearchPacket packet;

		public CompleteResearchEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(CompleteResearchPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<CompleteResearchListener> listeners) {
			for (CompleteResearchListener listener : listeners) {
				listener.onCompleteResearch(packet);
			}
		}

		@Override
		public Class<CompleteResearchListener> getListenerType() {
			return CompleteResearchListener.class;
		}
	}

}
