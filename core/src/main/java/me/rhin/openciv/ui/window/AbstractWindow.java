package me.rhin.openciv.ui.window;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.utils.viewport.Viewport;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.TopShapeRenderListener;

public abstract class AbstractWindow extends Group implements TopShapeRenderListener {

	protected Stage stage;
	protected Viewport viewport;
	private boolean open;
	private Class<? extends AbstractWindow> closedByWindow;

	public AbstractWindow() {
		this.stage = Civilization.getInstance().getScreenManager().getCurrentScreen().getOverlayStage();
		this.viewport = Civilization.getInstance().getScreenManager().getCurrentScreen().getViewport();

		open = true;

		Civilization.getInstance().getEventManager().addListener(TopShapeRenderListener.class, this);
	}

	@Override
	public void onTopShapeRender(ShapeRenderer shapeRenderer) {
		if (Civilization.DEBUG_BOUNDING_BOXES) {
			for (Actor actor : getChildren()) {

				shapeRenderer.setColor(Color.BLUE);

				// Bottom square
				shapeRenderer.line(this.getX() + actor.getX(), this.getY() + actor.getY() + 1,
						this.getX() + actor.getX() + actor.getWidth(), this.getY() + actor.getY() + 1);
				// Top square
				shapeRenderer.line(this.getX() + actor.getX(), this.getY() + actor.getY() + actor.getHeight(),
						this.getX() + actor.getX() + actor.getWidth(), this.getY() + actor.getY() + actor.getHeight());

				// Left square
				shapeRenderer.line(this.getX() + actor.getX() + 1, this.getY() + actor.getY(),
						this.getX() + actor.getX() + 1, this.getY() + actor.getY() + actor.getHeight());
				// Right square
				shapeRenderer.line(this.getX() + actor.getX() + actor.getWidth(), this.getY() + actor.getY(),
						this.getX() + actor.getX() + actor.getWidth(), this.getY() + actor.getY() + actor.getHeight());
			}
		}
	}

	public abstract boolean disablesInput();

	public abstract boolean disablesCameraMovement();

	public abstract boolean closesOtherWindows();

	public abstract boolean closesGameDisplayWindows();

	public abstract boolean isGameDisplayWindow();

	public boolean isOpen() {
		return open;
	}

	public void onClose() {
		open = false;
		Civilization.getInstance().getEventManager().removeListener(TopShapeRenderListener.class, this);
	}

	public void setClosedBy(Class<? extends AbstractWindow> closedByWindow) {
		this.closedByWindow = closedByWindow;
	}

	public Class<? extends AbstractWindow> getClosedByWindow() {
		return closedByWindow;
	}
}
