package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface CaptureCityListener extends Listener {

	public void onCaptureCity(City city, Player oldPlayer);

	public static class CaptureCityEvent extends Event<CaptureCityListener> {

		private City city;
		private Player oldPlayer;

		public CaptureCityEvent(City city, Player oldPlayer) {
			this.city = city;
			this.oldPlayer = oldPlayer;
		}

		@Override
		public void fire(ArrayList<CaptureCityListener> listeners) {
			for (CaptureCityListener listener : listeners) {
				listener.onCaptureCity(city, oldPlayer);
			}
		}

		@Override
		public Class<CaptureCityListener> getListenerType() {
			return CaptureCityListener.class;
		}

	}
}