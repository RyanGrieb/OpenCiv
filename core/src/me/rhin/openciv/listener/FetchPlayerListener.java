package me.rhin.openciv.listener;

import java.util.Queue;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;

public interface FetchPlayerListener extends Listener {

	public void onFetchPlayer(FetchPlayerPacket packet);

	public static class FetchPlayerEvent extends Event<FetchPlayerListener> {

		private FetchPlayerPacket packet;

		public FetchPlayerEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(FetchPlayerPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(Queue<FetchPlayerListener> listeners) {
			for (FetchPlayerListener listener : listeners)
				listener.onFetchPlayer(packet);
		}

		@Override
		public Class<FetchPlayerListener> getListenerType() {
			return FetchPlayerListener.class;
		}

	}
}
