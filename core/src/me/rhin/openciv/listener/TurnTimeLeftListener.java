package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.TurnTimeLeftPacket;

public interface TurnTimeLeftListener extends Listener {

	public void onTurnTimeLeft(TurnTimeLeftPacket packet);

	public static class TurnTimeLeftEvent extends Event<TurnTimeLeftListener> {

		private TurnTimeLeftPacket packet;

		public TurnTimeLeftEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(TurnTimeLeftPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<TurnTimeLeftListener> listeners) {
			for (TurnTimeLeftListener listener : listeners) {
				listener.onTurnTimeLeft(packet);
			}
		}

		@Override
		public Class<TurnTimeLeftListener> getListenerType() {
			return TurnTimeLeftListener.class;
		}
	}

}
