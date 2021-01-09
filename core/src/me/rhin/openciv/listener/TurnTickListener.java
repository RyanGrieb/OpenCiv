package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.TurnTickPacket;

public interface TurnTickListener extends Listener {

	public void onTurnTick(TurnTickPacket packet);

	public static class TurnTickEvent extends Event<TurnTickListener> {

		private TurnTickPacket packet;

		public TurnTickEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(TurnTickPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<TurnTickListener> listeners) {
			for (TurnTickListener listener : listeners) {
				listener.onTurnTick(packet);
			}
		}

		@Override
		public Class<TurnTickListener> getListenerType() {
			return TurnTickListener.class;
		}
	}

}
