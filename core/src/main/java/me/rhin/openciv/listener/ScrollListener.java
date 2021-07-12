package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface ScrollListener extends Listener {

	public void onScroll(float amountX, float amountY);

	public static class ScollEvent extends Event<ScrollListener> {

		private float amountX;
		private float amountY;

		public ScollEvent(float amountX, float amountY) {
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
