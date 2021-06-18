package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;

public interface WorkTileListener extends Listener {

	public void onWorkTile(WebSocket conn, WorkTilePacket packet);

	public static class WorkTileEvent extends Event<WorkTileListener> {

		private WorkTilePacket packet;
		private WebSocket conn;

		public WorkTileEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(WorkTilePacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<WorkTileListener> listeners) {
			for (WorkTileListener listener : listeners) {
				listener.onWorkTile(conn, packet);
			}
		}

		@Override
		public Class<WorkTileListener> getListenerType() {
			return WorkTileListener.class;
		}

	}

}
