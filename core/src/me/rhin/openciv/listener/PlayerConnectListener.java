package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;

public interface PlayerConnectListener extends Listener {

	public void onPlayerConnect(PlayerConnectPacket packet);

	public static class PlayerConnectEvent extends Event<PlayerConnectListener> {

		private PlayerConnectPacket packet;

		public PlayerConnectEvent(PacketParameter packetParamter) {
			Json json = new Json();
			//PlayerConnectPacket extends Packet
			this.packet = json.fromJson(PlayerConnectPacket.class, packetParamter.getPacket());
			//json.fromJson(type, elementType, json)
		}

		@Override
		public void fire(ArrayList<PlayerConnectListener> listeners) {
			for (PlayerConnectListener listener : listeners) {
				listener.onPlayerConnect(packet);
			}
		}

		@Override
		public Class<PlayerConnectListener> getListenerType() {
			return PlayerConnectListener.class;
		}

	}
}
