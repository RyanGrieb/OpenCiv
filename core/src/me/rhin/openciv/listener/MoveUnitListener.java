package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;

public interface MoveUnitListener extends Listener {

	public void onUnitMove(MoveUnitPacket packet);

	public static class MoveUnitEvent extends Event<MoveUnitListener> {

		private MoveUnitPacket packet;

		public MoveUnitEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(MoveUnitPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<MoveUnitListener> listeners) {
			for (MoveUnitListener listener : listeners) {
				listener.onUnitMove(packet);
			}
		}

		@Override
		public Class<MoveUnitListener> getListenerType() {
			return MoveUnitListener.class;
		}
	}
}
