package me.rhin.openciv.listener;

import java.util.Queue;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.util.ClickType;

public interface RightClickListener extends Listener {
	public void onRightClick(ClickType clickType, int x, int y);

	public static class RightClickEvent extends Event<RightClickListener> {

		private ClickType clickType;
		private int x, y;

		public RightClickEvent(ClickType clickType, int x, int y) {
			this.clickType = clickType;
			this.x = x;
			this.y = y;
		}

		@Override
		public void fire(Queue<RightClickListener> listeners) {
			for (RightClickListener listener : listeners) {
				listener.onRightClick(clickType, x, y);
			}
		}

		@Override
		public Class<RightClickListener> getListenerType() {
			return RightClickListener.class;
		}

	}
}
