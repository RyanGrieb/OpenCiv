package me.rhin.openciv.events.type;

import com.badlogic.gdx.graphics.glutils.ShapeRenderer;

import me.rhin.openciv.shared.listener.Event;

public class BottomShapeRenderEvent implements Event {

	public static final BottomShapeRenderEvent INSTANCE = new BottomShapeRenderEvent();

	private static ShapeRenderer shapeRenderer;

	public static void setShapeRenderer(ShapeRenderer renderer) {
		shapeRenderer = renderer;
	}

	@Override
	public String getMethodName() {
		return "onBottomShapeRender";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { shapeRenderer };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { shapeRenderer.getClass() };
	}

}
