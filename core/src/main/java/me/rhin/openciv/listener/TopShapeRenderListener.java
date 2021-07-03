package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.glutils.ShapeRenderer;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface TopShapeRenderListener extends Listener {

	public void onTopShapeRender(ShapeRenderer shapeRenderer);

	public static class TopShapeRenderEvent extends Event<TopShapeRenderListener> {

		public static final TopShapeRenderEvent INSTANCE = new TopShapeRenderEvent();

		private static ShapeRenderer shapeRenderer;

		public static void setShapeRenderer(ShapeRenderer renderer) {
			shapeRenderer = renderer;
		}

		@Override
		public void fire(ArrayList<TopShapeRenderListener> listeners) {
			for (TopShapeRenderListener listener : listeners) {
				listener.onTopShapeRender(shapeRenderer);
			}
		}

		@Override
		public Class<TopShapeRenderListener> getListenerType() {
			return TopShapeRenderListener.class;
		}
	}

}
