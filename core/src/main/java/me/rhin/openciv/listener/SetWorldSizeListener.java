package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SetWorldSizePacket;

public interface SetWorldSizeListener extends Listener {

	public void onSetWorldSize(SetWorldSizePacket packet);

	public static class SetWorldSizeEvent extends Event<SetWorldSizeListener> {

		private SetWorldSizePacket packet;

		public SetWorldSizeEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(SetWorldSizePacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<SetWorldSizeListener> listeners) {
			for (SetWorldSizeListener listener : listeners) {
				listener.onSetWorldSize(packet);
			}
		}

		@Override
		public Class<SetWorldSizeListener> getListenerType() {
			return SetWorldSizeListener.class;
		}
	}

}
