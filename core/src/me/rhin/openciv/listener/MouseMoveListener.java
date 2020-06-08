package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.math.Vector3;

import me.rhin.openciv.Civilization;
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
			Vector3 gamePosition = Civilization.getInstance().getCamera().unproject(worldCoordinates);

			if (gamePosition.x != x || gamePosition.y != y) {
				x = gamePosition.x;
				y = gamePosition.y;
				return true;
			}

			return false;
		}

		@Override
		public void fire(ArrayList<MouseMoveListener> listeners) {
			if (!hasMouseMoved())
				return;

			for (MouseMoveListener listener : listeners) {
				// listener.onMouseMove(x, Gdx.graphics.getHeight() - y);
				listener.onMouseMove(x, y);
			}
		}

		@Override
		public Class<MouseMoveListener> getListenerType() {
			return MouseMoveListener.class;
		}

	}

}
