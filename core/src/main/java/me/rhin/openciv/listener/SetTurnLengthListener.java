package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SetTurnLengthPacket;

public interface SetTurnLengthListener extends Listener {

	public void onSetTurnLength(SetTurnLengthPacket packet);

	public static class SetTurnLengthEvent extends Event<SetTurnLengthListener> {

		private SetTurnLengthPacket packet;

		public SetTurnLengthEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(SetTurnLengthPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<SetTurnLengthListener> listeners) {
			for (SetTurnLengthListener listener : listeners) {
				listener.onSetTurnLength(packet);
			}
		}

		@Override
		public Class<SetTurnLengthListener> getListenerType() {
			return SetTurnLengthListener.class;
		}
	}
}
