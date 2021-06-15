package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;

public interface UnitAttackListener extends Listener {

	public void onUnitAttack(UnitAttackPacket packet);

	public static class UnitAttackEvent extends Event<UnitAttackListener> {

		private UnitAttackPacket packet;

		public UnitAttackEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(UnitAttackPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<UnitAttackListener> listeners) {
			for (UnitAttackListener listener : listeners) {
				listener.onUnitAttack(packet);
			}
		}

		@Override
		public Class<UnitAttackListener> getListenerType() {
			return UnitAttackListener.class;
		}
	}

}
