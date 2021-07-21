package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.RequestEndTurnPacket;

public interface RequestEndTurnListener extends Listener {

	public void onRequestEndTurn(RequestEndTurnPacket packet);

	public static class RequestEndTurnEvent extends Event<RequestEndTurnListener> {

		private RequestEndTurnPacket packet;

		public RequestEndTurnEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(RequestEndTurnPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<RequestEndTurnListener> listeners) {
			for (RequestEndTurnListener listener : listeners) {
				listener.onRequestEndTurn(packet);
			}
		}

		@Override
		public Class<RequestEndTurnListener> getListenerType() {
			return RequestEndTurnListener.class;
		}
	}

}
