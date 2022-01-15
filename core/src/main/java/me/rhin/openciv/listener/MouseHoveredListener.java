package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface MouseHoveredListener extends Listener {

	public void onMouseHovered(float mouseX, float mouseY);

	public static class MouseHoveredEvent extends Event<MouseHoveredListener> {

		private float mouseX, mouseY;

		public MouseHoveredEvent(float mouseX, float mouseY) {
			this.mouseX = mouseX;
			this.mouseY = mouseY;
		}

		@Override
		public void fire(ArrayList<MouseHoveredListener> listeners) {
			for (MouseHoveredListener listener : listeners)
				listener.onMouseHovered(mouseX, mouseY);
		}

		@Override
		public Class<MouseHoveredListener> getListenerType() {
			return MouseHoveredListener.class;
		}

	}
}
