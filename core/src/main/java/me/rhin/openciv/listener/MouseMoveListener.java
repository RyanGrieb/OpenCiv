package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.math.Vector3;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface MouseMoveListener extends Listener {

	public void onMouseMove(float x, float y);

	public static class MouseMoveEvent extends Event<MouseMoveListener> {

		private float x, y;

		public static final MouseMoveEvent INSTANCE = new MouseMoveEvent();
		private static Vector3 worldCoordinates = new Vector3();

		public boolean hasMouseMoved() {
			worldCoordinates.set(Gdx.input.getX(), Gdx.input.getY(), 0);

			if (Gdx.input.getX() != x || Gdx.graphics.getHeight() - Gdx.input.getY() != y) {
				x = Gdx.input.getX();
				y = Gdx.graphics.getHeight() - Gdx.input.getY();
				return true;
			}

			return false;
		}

		@Override
		public void fire(ArrayList<MouseMoveListener> listeners) {
			if (!hasMouseMoved())
				return;

			for (MouseMoveListener listener : listeners) {
				listener.onMouseMove(x, y);
			}
		}

		@Override
		public Class<MouseMoveListener> getListenerType() {
			return MouseMoveListener.class;
		}

	}

}
