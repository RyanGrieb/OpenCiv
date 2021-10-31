package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface ScrollListener extends Listener {

	void onScroll(float amountX, float amountY);

	class ScrollEvent extends Event<ScrollListener> {

		private final float amountX;
		private final float amountY;

		public ScrollEvent(float amountX, float amountY) {
			this.amountX = amountX;
			this.amountY = amountY;
		}

		@Override
		public void fire(ArrayList<ScrollListener> listeners) {
			for (ScrollListener listener : listeners)
				listener.onScroll(amountX, amountY);
		}

		@Override
		public Class<ScrollListener> getListenerType() {
			return ScrollListener.class;
		}

	}
}
