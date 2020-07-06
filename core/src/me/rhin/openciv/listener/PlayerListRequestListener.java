package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;

public interface PlayerListRequestListener extends Listener {

	public void onPlayerListRequested(PlayerListRequestPacket packet);

	public static class PlayerListRequestEvent extends Event<PlayerListRequestListener> {

		private PlayerListRequestPacket packet;

		public PlayerListRequestEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(PlayerListRequestPacket.class, packetParamter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<PlayerListRequestListener> listeners) {
			for (PlayerListRequestListener listener : listeners) {
				listener.onPlayerListRequested(packet);
			}
		}

		@Override
		public Class<PlayerListRequestListener> getListenerType() {
			return PlayerListRequestListener.class;
		}

	}
}
