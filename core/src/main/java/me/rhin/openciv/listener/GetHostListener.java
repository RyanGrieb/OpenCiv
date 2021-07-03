package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.GetHostPacket;

public interface GetHostListener extends Listener {

	public void onGetHost(GetHostPacket packet);

	public static class GetHostEvent extends Event<GetHostListener> {

		private GetHostPacket packet;

		public GetHostEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(GetHostPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<GetHostListener> listeners) {
			for (GetHostListener listener : listeners) {
				listener.onGetHost(packet);
			}
		}

		@Override
		public Class<GetHostListener> getListenerType() {
			return GetHostListener.class;
		}
	}
}