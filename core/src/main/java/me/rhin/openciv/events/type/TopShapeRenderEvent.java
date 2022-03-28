
package me.rhin.openciv.events.type;

import com.badlogic.gdx.graphics.glutils.ShapeRenderer;

import me.rhin.openciv.shared.listener.Event;

public class TopShapeRenderEvent implements Event {

	public static final TopShapeRenderEvent INSTANCE = new TopShapeRenderEvent();

	private static ShapeRenderer shapeRenderer;

	public static void setShapeRenderer(ShapeRenderer renderer) {
		shapeRenderer = renderer;
	}

	@Override
	public String getMethodName() {
		return "onTopShapeRender";
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