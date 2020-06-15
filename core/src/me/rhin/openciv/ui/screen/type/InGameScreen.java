package me.rhin.openciv.ui.screen.type;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer.ShapeType;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.utils.TimeUtils;
import com.badlogic.gdx.utils.viewport.Viewport;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.CivGame;
import me.rhin.openciv.listener.LeftClickListener.LeftClickEvent;
import me.rhin.openciv.listener.MouseMoveListener.MouseMoveEvent;
import me.rhin.openciv.listener.RelativeMouseMoveListener.RelativeMouseMoveEvent;
import me.rhin.openciv.listener.RightClickListener.RightClickEvent;
import me.rhin.openciv.listener.ShapeRenderListener.ShapeRenderEvent;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.overlay.GameOverlay;
import me.rhin.openciv.ui.overlay.UnitOverlay;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.util.ClickType;

public class InGameScreen extends AbstractScreen {

	private Viewport overlayViewport;
	private GameOverlay gameOverlay;
	private UnitOverlay unitOverlay;
	private EventManager eventManager;
	private CivGame game;
	private ShapeRenderer shapeRenderer;

	long lastTimeCounted;
	private float frameRate;

	public InGameScreen() {
		this.gameOverlay = new GameOverlay();

		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearEvents();

		lastTimeCounted = TimeUtils.millis();
		frameRate = Gdx.graphics.getFramesPerSecond();
	}

	@Override
	public void show() {
		super.show();

		this.game = new CivGame();
		this.shapeRenderer = new ShapeRenderer();
		ShapeRenderEvent.setShapeRenderer(shapeRenderer);

		Label.LabelStyle label1Style = new Label.LabelStyle();
		label1Style.font = Civilization.getInstance().getFont();
		label1Style.fontColor = Color.WHITE;

		getCamera().zoom = 0.6F; // 0.8 Default
	}

	@Override
	public void render(float delta) {
		super.render(delta);
		handleInput();

		Gdx.gl.glEnable(GL20.GL_BLEND);
		Gdx.gl.glBlendFunc(GL20.GL_SRC_ALPHA, GL20.GL_ONE_MINUS_SRC_ALPHA);
		shapeRenderer.setProjectionMatrix(camera.combined);
		shapeRenderer.begin(ShapeType.Line);
		Civilization.getInstance().getEventManager().fireEvent(ShapeRenderEvent.INSTANCE);
		shapeRenderer.end();
		Gdx.gl.glDisable(GL20.GL_BLEND);

		Civilization.getInstance().getEventManager().fireEvent(MouseMoveEvent.INSTANCE);
		Civilization.getInstance().getEventManager().fireEvent(RelativeMouseMoveEvent.INSTANCE);

		long timeSince = TimeUtils.timeSinceMillis(lastTimeCounted);
		if (timeSince >= 500) {
			frameRate = Gdx.graphics.getFramesPerSecond();
		}

		gameOverlay.getFPSLabel().setText("FPS: " + frameRate);

		gameOverlay.act();
		gameOverlay.draw();
		if (unitOverlay != null) {
			unitOverlay.act();
			unitOverlay.draw();
		}
	}

	@Override
	public void resize(int width, int height) {
		// overlayViewport.setScreenSize(width, height);
		// overlayViewport.update(width, height, true);
		// overlayViewport.setScreenSize(Gdx.graphics.getWidth(),
		// Gdx.graphics.getHeight());
	}

	@Override
	public boolean touchUp(int x, int y, int pointer, int button) {
		if (button == Input.Buttons.LEFT)
			Civilization.getInstance().getEventManager().fireEvent(new LeftClickEvent(x, y));

		if (button == Input.Buttons.RIGHT)
			Civilization.getInstance().getEventManager().fireEvent(new RightClickEvent(ClickType.UP, x, y));
		return false;
	}

	@Override
	public boolean touchDown(int x, int y, int pointer, int button) {
		if (button == Input.Buttons.RIGHT)
			Civilization.getInstance().getEventManager().fireEvent(new RightClickEvent(ClickType.DOWN, x, y));

		return false;
	}

	@Override
	public boolean keyUp(int keycode) {
		if (keycode == Input.Keys.G) {
			// game.getGameMap().resetTerrain();
			// game.getGameMap().generateTerrain();
		}
		return false;
	}

	private void handleInput() {
		OrthographicCamera cam = getCamera();
		if (Gdx.input.isKeyPressed(Input.Keys.EQUALS)) {
			cam.zoom += 0.04;
		}

		if (Gdx.input.isKeyPressed(Input.Keys.MINUS)) {
			cam.zoom -= 0.04;
		}
		if (Gdx.input.isKeyPressed(Input.Keys.A)) {
			tanslateCamera(-6, 0, 0);
		}
		if (Gdx.input.isKeyPressed(Input.Keys.D)) {
			tanslateCamera(6, 0, 0);
		}
		if (Gdx.input.isKeyPressed(Input.Keys.S)) {
			tanslateCamera(0, -6, 0);
		}
		if (Gdx.input.isKeyPressed(Input.Keys.W)) {
			tanslateCamera(0, 6, 0);
		}

	}

	public CivGame getGame() {
		return game;
	}

	public void setUnitOverlay(UnitOverlay unitOverlay) {
		this.unitOverlay = unitOverlay;
	}
}
