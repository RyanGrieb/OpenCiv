package me.rhin.openciv.listener;

import java.util.Queue;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.math.Vector3;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface LeftClickListener extends Listener {

	public void onLeftClick(float x, float y);

	public static class LeftClickEvent extends Event<LeftClickListener> {

		private float x, y;

		public LeftClickEvent(int x, int y) {
			Vector3 worldCoords = new Vector3(Gdx.input.getX(), Gdx.input.getY(), 0);
			Vector3 gamePosition = Civilization.getInstance().getCamera().unproject(worldCoords);
			this.x = gamePosition.x;
			this.y = gamePosition.y;
		}

		@Override
		public void fire(Queue<LeftClickListener> listeners) {
			for (LeftClickListener listener : listeners) {
				listener.onLeftClick(x, y);
			}
		}

		@Override
		public Class<LeftClickListener> getListenerType() {
			return LeftClickListener.class;
		}

	}
}
