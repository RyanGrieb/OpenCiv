package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface RenderListener extends Listener {
	public void onRender();

	public static class RenderEvent extends Event<RenderListener> {

		public static final RenderEvent INSTANCE = new RenderEvent();

		@Override
		public void fire(ArrayList<RenderListener> listeners) {
			for (RenderListener listener : listeners) {
				listener.onRender();
			}
		}

		@Override
		public Class<RenderListener> getListenerType() {
			return RenderListener.class;
		}

	}
}
