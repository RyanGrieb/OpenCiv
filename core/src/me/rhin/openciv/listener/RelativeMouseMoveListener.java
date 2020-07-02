package me.rhin.openciv.listener;

import java.util.Queue;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.math.Vector3;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface RelativeMouseMoveListener extends Listener {

	public void onRelativeMouseMove(float x, float y);

	public static class RelativeMouseMoveEvent extends Event<RelativeMouseMoveListener> {

		private float x, y;

		public static final RelativeMouseMoveEvent INSTANCE = new RelativeMouseMoveEvent();
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
		public void fire(Queue<RelativeMouseMoveListener> listeners) {
			if (!hasMouseMoved())
				return;

			for (RelativeMouseMoveListener listener : listeners) {
				// listener.onMouseMove(x, Gdx.graphics.getHeight() - y);
				listener.onRelativeMouseMove(x, y);
			}
		}

		@Override
		public Class<RelativeMouseMoveListener> getListenerType() {
			return RelativeMouseMoveListener.class;
		}

	}

}
