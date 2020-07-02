package me.rhin.openciv.listener;

import java.util.Queue;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface RightMouseHeldListener extends Listener {
	public void onRightMouseHeld(int x, int y);

	public static class RightMouseHeldEvent extends Event<RightMouseHeldListener> {

		private int x, y;

		public RightMouseHeldEvent(int x, int y) {
			this.x = x;
			this.y = y;
		}

		@Override
		public void fire(Queue<RightMouseHeldListener> listeners) {
			for (RightMouseHeldListener listener : listeners) {
				listener.onRightMouseHeld(x, y);
			}
		}

		@Override
		public Class<RightMouseHeldListener> getListenerType() {
			return RightMouseHeldListener.class;
		}

	}
}
