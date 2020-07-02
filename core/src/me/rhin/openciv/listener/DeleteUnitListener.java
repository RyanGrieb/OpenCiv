package me.rhin.openciv.listener;

import java.util.Queue;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;

public interface DeleteUnitListener extends Listener {

	public void onUnitDelete(DeleteUnitPacket packet);

	public static class DeleteUnitEvent extends Event<DeleteUnitListener> {

		private DeleteUnitPacket packet;

		public DeleteUnitEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(DeleteUnitPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(Queue<DeleteUnitListener> listeners) {
			for (DeleteUnitListener listener : listeners) {
				listener.onUnitDelete(packet);
			}
		}

		@Override
		public Class<DeleteUnitListener> getListenerType() {
			return DeleteUnitListener.class;
		}
	}
}
