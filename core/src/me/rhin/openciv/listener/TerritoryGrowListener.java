package me.rhin.openciv.listener;

import java.util.Queue;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.TerritoryGrowPacket;

public interface TerritoryGrowListener extends Listener {

	public void onTerritoryGrow(TerritoryGrowPacket packet);

	public static class TerritoryGrowEvent extends Event<TerritoryGrowListener> {

		private TerritoryGrowPacket packet;

		public TerritoryGrowEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(TerritoryGrowPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(Queue<TerritoryGrowListener> listeners) {
			for (TerritoryGrowListener listener : listeners) {
				listener.onTerritoryGrow(packet);
			}
		}

		@Override
		public Class<TerritoryGrowListener> getListenerType() {
			return TerritoryGrowListener.class;
		}
	}

}
