package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.ResearchFinishPacket;

public interface ResearchFinishListener extends Listener {

	public void onResearchFinished(ResearchFinishPacket packet);

	public static class ResearchFinishEvent extends Event<ResearchFinishListener> {

		private ResearchFinishPacket packet;

		public ResearchFinishEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(ResearchFinishPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<ResearchFinishListener> listeners) {
			for (ResearchFinishListener listener : listeners) {
				listener.onResearchFinished(packet);
			}
		}

		@Override
		public Class<ResearchFinishListener> getListenerType() {
			return ResearchFinishListener.class;
		}
	}
}
