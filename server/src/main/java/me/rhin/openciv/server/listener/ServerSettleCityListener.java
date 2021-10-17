package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface ServerSettleCityListener extends Listener {

	public void onSettleCity(City city);

	public static class ServerSettleCityEvent extends Event<ServerSettleCityListener> {

		private City city;

		public ServerSettleCityEvent(City city) {
			this.city = city;
		}

		@Override
		public void fire(ArrayList<ServerSettleCityListener> listeners) {
			for (ServerSettleCityListener listener : listeners) {
				listener.onSettleCity(city);
			}
		}

		@Override
		public Class<ServerSettleCityListener> getListenerType() {
			return ServerSettleCityListener.class;
		}

	}

}
