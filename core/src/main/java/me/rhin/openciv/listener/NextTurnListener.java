package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;

public interface NextTurnListener extends Listener {

	public void onNextTurn(NextTurnPacket packet);

	public static class NextTurnEvent extends Event<NextTurnListener> {

		private NextTurnPacket packet;

		public NextTurnEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(NextTurnPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<NextTurnListener> listeners) {
			for (NextTurnListener listener : listeners) {
				listener.onNextTurn(packet);
			}
		}

		@Override
		public Class<NextTurnListener> getListenerType() {
			return NextTurnListener.class;
		}
	}
}
