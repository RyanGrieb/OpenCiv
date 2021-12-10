package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.UpgradeUnitPacket;

public interface UpgradeUnitListener extends Listener {

	public void onUnitUpgrade(WebSocket conn, UpgradeUnitPacket packet);

	public static class UpgradeUnitEvent extends Event<UpgradeUnitListener> {

		private UpgradeUnitPacket packet;
		private WebSocket conn;

		public UpgradeUnitEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(UpgradeUnitPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<UpgradeUnitListener> listeners) {
			for (UpgradeUnitListener listener : listeners) {
				listener.onUnitUpgrade(conn, packet);
			}
		}

		@Override
		public Class<UpgradeUnitListener> getListenerType() {
			return UpgradeUnitListener.class;
		}

	}

}
