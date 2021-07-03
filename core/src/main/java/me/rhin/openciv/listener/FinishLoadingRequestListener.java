package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.FinishLoadingPacket;

public interface FinishLoadingRequestListener extends Listener {

	public void onFinishLoadingRequest(FinishLoadingPacket packet);

	public static class FinishLoadingRequestEvent extends Event<FinishLoadingRequestListener> {

		private FinishLoadingPacket packet;

		public FinishLoadingRequestEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(FinishLoadingPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<FinishLoadingRequestListener> listeners) {
			for (FinishLoadingRequestListener listener : listeners) {
				listener.onFinishLoadingRequest(packet);
			}
		}

		@Override
		public Class<FinishLoadingRequestListener> getListenerType() {
			return FinishLoadingRequestListener.class;
		}
	}

}
