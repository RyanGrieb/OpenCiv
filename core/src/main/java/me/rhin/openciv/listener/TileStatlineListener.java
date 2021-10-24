package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.TileStatlinePacket;

public interface TileStatlineListener extends Listener {

	public void onRecieveTileStatline(TileStatlinePacket packet);

	public static class TileStatlineEvent extends Event<TileStatlineListener> {

		private TileStatlinePacket packet;

		public TileStatlineEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(TileStatlinePacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<TileStatlineListener> listeners) {
			for (TileStatlineListener listener : listeners) {
				listener.onRecieveTileStatline(packet);
			}
		}

		@Override
		public Class<TileStatlineListener> getListenerType() {
			return TileStatlineListener.class;
		}
	}
}
