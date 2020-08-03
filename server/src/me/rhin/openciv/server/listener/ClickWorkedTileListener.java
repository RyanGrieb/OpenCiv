package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.ClickWorkedTilePacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;

public interface ClickWorkedTileListener extends Listener {

	public void onClickWorkedTile(WebSocket conn, ClickWorkedTilePacket packet);

	public static class ClickWorkedTileEvent extends Event<ClickWorkedTileListener> {

		private ClickWorkedTilePacket packet;
		private WebSocket conn;

		public ClickWorkedTileEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(ClickWorkedTilePacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<ClickWorkedTileListener> listeners) {
			for (ClickWorkedTileListener listener : listeners) {
				listener.onClickWorkedTile(conn, packet);
			}
		}

		@Override
		public Class<ClickWorkedTileListener> getListenerType() {
			return ClickWorkedTileListener.class;
		}

	}

}
