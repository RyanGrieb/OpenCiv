package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.CombatPreviewPacket;

public interface CombatPreviewListener extends Listener {

	public void onCombatPreview(WebSocket conn, CombatPreviewPacket packet);

	public static class CombatPreviewEvent extends Event<CombatPreviewListener> {

		private CombatPreviewPacket packet;
		private WebSocket conn;

		public CombatPreviewEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(CombatPreviewPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<CombatPreviewListener> listeners) {
			for (CombatPreviewListener listener : listeners) {
				listener.onCombatPreview(conn, packet);
			}
		}

		@Override
		public Class<CombatPreviewListener> getListenerType() {
			return CombatPreviewListener.class;
		}

	}

}
