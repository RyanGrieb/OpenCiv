package me.rhin.openciv.listener;

import java.util.Queue;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.MapChunkPacket;

public interface ReceiveMapChunkListener extends Listener {

	public void onReciveMapChunk(MapChunkPacket packet);

	public static class ReciveMapChunkEvent extends Event<ReceiveMapChunkListener> {

		private MapChunkPacket packet;

		public ReciveMapChunkEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(MapChunkPacket.class, packetParamter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(Queue<ReceiveMapChunkListener> listeners) {
			for (ReceiveMapChunkListener listener : listeners)
				listener.onReciveMapChunk(packet);
		}

		@Override
		public Class<ReceiveMapChunkListener> getListenerType() {
			return ReceiveMapChunkListener.class;
		}

	}

}
