package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.DeclareWarAllPacket;

public interface DeclareWarAllListener extends Listener {

	public void onDeclareWarAll(DeclareWarAllPacket packet);

	public static class DeclareWarAllEvent extends Event<DeclareWarAllListener> {

		private DeclareWarAllPacket packet;

		public DeclareWarAllEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(DeclareWarAllPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<DeclareWarAllListener> listeners) {
			for (DeclareWarAllListener listener : listeners) {
				listener.onDeclareWarAll(packet);
			}
		}

		@Override
		public Class<DeclareWarAllListener> getListenerType() {
			return DeclareWarAllListener.class;
		}
	}

}
