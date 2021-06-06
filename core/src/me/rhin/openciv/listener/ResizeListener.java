package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface ResizeListener extends Listener {
	public void onResize(int width, int height);

	public static class ResizeEvent extends Event<ResizeListener> {

		private int width, height;

		public ResizeEvent(int width, int height) {
			this.width = width;
			this.height = height;
		}

		@Override
		public void fire(ArrayList<ResizeListener> listeners) {
			for (ResizeListener listener : listeners) {
				listener.onResize(width, height);
			}
		}

		@Override
		public Class<ResizeListener> getListenerType() {
			return ResizeListener.class;
		}

	}
}
