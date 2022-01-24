package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface PlayersSpawnsSetListener extends Listener {

	public void onPlayersSpawnSet();

	public static class PlayersSpawnsSetEvent extends Event<PlayersSpawnsSetListener> {

		@Override
		public void fire(ArrayList<PlayersSpawnsSetListener> listeners) {
			for (PlayersSpawnsSetListener listener : listeners) {
				listener.onPlayersSpawnSet();
			}
		}

		@Override
		public Class<PlayersSpawnsSetListener> getListenerType() {
			return PlayersSpawnsSetListener.class;
		}
	}
}
