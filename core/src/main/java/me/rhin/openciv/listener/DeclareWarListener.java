package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.DeclareWarPacket;

public interface DeclareWarListener extends Listener {

	public void onDeclareWar(DeclareWarPacket packet);

	public static class DeclareWarEvent extends Event<DeclareWarListener> {

		private DeclareWarPacket packet;

		public DeclareWarEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(DeclareWarPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<DeclareWarListener> listeners) {
			for (DeclareWarListener listener : listeners) {
				listener.onDeclareWar(packet);
			}
		}

		@Override
		public Class<DeclareWarListener> getListenerType() {
			return DeclareWarListener.class;
		}
	}

}
