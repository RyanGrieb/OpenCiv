package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.TurnTimeUpdatePacket;

public interface TurnTimeUpdateListener extends Listener {

	public void onTurnTimeUpdate(TurnTimeUpdatePacket packet);

	public static class TurnTimeUpdateEvent extends Event<TurnTimeUpdateListener> {

		private TurnTimeUpdatePacket packet;

		public TurnTimeUpdateEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(TurnTimeUpdatePacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<TurnTimeUpdateListener> listeners) {
			for (TurnTimeUpdateListener listener : listeners) {
				listener.onTurnTimeUpdate(packet);
			}
		}

		@Override
		public Class<TurnTimeUpdateListener> getListenerType() {
			return TurnTimeUpdateListener.class;
		}
	}
}
