package me.rhin.openciv.events.type;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.math.Vector3;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.shared.listener.Event;

public class RelativeMouseMoveEvent implements Event {

	public static final RelativeMouseMoveEvent INSTANCE = new RelativeMouseMoveEvent();
	private static Vector3 worldCoordinates = new Vector3();
	private static float x, y;

	public static boolean hasMouseMoved() {
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
	public String getMethodName() {
		return "onRelativeMouseMove";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { x, y };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { float.class, float.class };
	}

}
