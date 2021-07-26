package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.game.heritage.Heritage;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface PickHeritageListener extends Listener {

	public void onPickHeritage(Heritage heritage);

	public static class PickHeritageEvent extends Event<PickHeritageListener> {

		private Heritage heritage;

		public PickHeritageEvent(Heritage heritage) {
			this.heritage = heritage;
		}

		@Override
		public void fire(ArrayList<PickHeritageListener> listeners) {
			for (PickHeritageListener listener : listeners) {
				listener.onPickHeritage(heritage);
			}
		}

		@Override
		public Class<PickHeritageListener> getListenerType() {
			return PickHeritageListener.class;
		}
	}

}
