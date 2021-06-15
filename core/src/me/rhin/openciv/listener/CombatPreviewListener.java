package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.CombatPreviewPacket;

public interface CombatPreviewListener extends Listener {

	public void onCombatPreview(CombatPreviewPacket packet);

	public static class CombatPreviewEvent extends Event<CombatPreviewListener> {

		private CombatPreviewPacket packet;

		public CombatPreviewEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(CombatPreviewPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<CombatPreviewListener> listeners) {
			for (CombatPreviewListener listener : listeners) {
				listener.onCombatPreview(packet);
			}
		}

		@Override
		public Class<CombatPreviewListener> getListenerType() {
			return CombatPreviewListener.class;
		}
	}

}
