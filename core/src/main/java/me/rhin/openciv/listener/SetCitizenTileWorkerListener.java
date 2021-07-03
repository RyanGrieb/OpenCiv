package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket;

public interface SetCitizenTileWorkerListener extends Listener {

	public void onSetCitizenTileWorker(SetCitizenTileWorkerPacket packet);

	public static class SetCitizenTileWorkerEvent extends Event<SetCitizenTileWorkerListener> {

		private SetCitizenTileWorkerPacket packet;

		public SetCitizenTileWorkerEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(SetCitizenTileWorkerPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<SetCitizenTileWorkerListener> listeners) {
			for (SetCitizenTileWorkerListener listener : listeners) {
				listener.onSetCitizenTileWorker(packet);
			}
		}

		@Override
		public Class<SetCitizenTileWorkerListener> getListenerType() {
			return SetCitizenTileWorkerListener.class;
		}
	}

}
