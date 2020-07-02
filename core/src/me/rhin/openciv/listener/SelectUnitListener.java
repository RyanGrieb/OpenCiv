package me.rhin.openciv.listener;

import java.util.Queue;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;

public interface SelectUnitListener extends Listener {

	public void onSelectUnit(SelectUnitPacket packet);

	public static class SelectUnitEvent extends Event<SelectUnitListener> {

		private SelectUnitPacket packet;

		public SelectUnitEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(SelectUnitPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(Queue<SelectUnitListener> listeners) {
			for (SelectUnitListener listener : listeners)
				listener.onSelectUnit(packet);
		}

		@Override
		public Class<SelectUnitListener> getListenerType() {
			return SelectUnitListener.class;
		}

	}
}
