package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.game.map.road.Road;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface RoadConstructedListener extends Listener {

	public void onRoadConstructed(Road road);

	public static class RoadConstructedEvent extends Event<RoadConstructedListener> {

		private Road road;

		public RoadConstructedEvent(Road road) {
			this.road = road;
		}

		@Override
		public void fire(ArrayList<RoadConstructedListener> listeners) {
			for (RoadConstructedListener listener : listeners) {
				listener.onRoadConstructed(road);
			}
		}

		@Override
		public Class<RoadConstructedListener> getListenerType() {
			return RoadConstructedListener.class;
		}

	}
}
