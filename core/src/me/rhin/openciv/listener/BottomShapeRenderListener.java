package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.glutils.ShapeRenderer;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface BottomShapeRenderListener extends Listener {
	
	public void onBottomShapeRender(ShapeRenderer shapeRenderer);

	public static class BottomShapeRenderEvent extends Event<BottomShapeRenderListener> {

		public static final BottomShapeRenderEvent INSTANCE = new BottomShapeRenderEvent();

		private static ShapeRenderer shapeRenderer;

		public static void setShapeRenderer(ShapeRenderer renderer) {
			shapeRenderer = renderer;
		}

		@Override
		public void fire(ArrayList<BottomShapeRenderListener> listeners) {
			for (BottomShapeRenderListener listener : listeners) {
				listener.onBottomShapeRender(shapeRenderer);
			}
		}

		@Override
		public Class<BottomShapeRenderListener> getListenerType() {
			return BottomShapeRenderListener.class;
		}
	}
}
