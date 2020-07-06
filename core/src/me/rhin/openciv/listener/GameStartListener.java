package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface GameStartListener extends Listener {

	public void onGameStart();

	public static class GameStartEvent extends Event<GameStartListener> {

		public GameStartEvent(PacketParameter packetParamter) {
		}

		@Override
		public void fire(ArrayList<GameStartListener> listeners) {
			for (GameStartListener listener : listeners)
				listener.onGameStart();
		}

		@Override
		public Class<GameStartListener> getListenerType() {
			return GameStartListener.class;
		}

	}
}
