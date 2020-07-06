package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.glutils.ShapeRenderer;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface ShapeRenderListener extends Listener {
	public void onShapeRender(ShapeRenderer shapeRenderer);

	public static class ShapeRenderEvent extends Event<ShapeRenderListener> {

		public static final ShapeRenderEvent INSTANCE = new ShapeRenderEvent();

		private static ShapeRenderer shapeRenderer;

		public static void setShapeRenderer(ShapeRenderer renderer) {
			shapeRenderer = renderer;
		}

		@Override
		public void fire(ArrayList<ShapeRenderListener> listeners) {
			for (ShapeRenderListener listener : listeners) {
				listener.onShapeRender(shapeRenderer);
			}
		}

		@Override
		public Class<ShapeRenderListener> getListenerType() {
			return ShapeRenderListener.class;
		}
	}
}
