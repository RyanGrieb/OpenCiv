package me.rhin.openciv.ui.screen.type;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer.ShapeType;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.utils.TimeUtils;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.Game;
import me.rhin.openciv.listener.LeftClickListener;
import me.rhin.openciv.listener.MouseMoveListener;
import me.rhin.openciv.listener.PlayerConnectListener;
import me.rhin.openciv.listener.RightClickListener;
import me.rhin.openciv.listener.LeftClickListener.LeftClickEvent;
import me.rhin.openciv.listener.MouseMoveListener.MouseMoveEvent;
import me.rhin.openciv.listener.RightClickListener.RightClickEvent;
import me.rhin.openciv.listener.ShapeRenderListener.ShapeRenderEvent;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.util.ClickType;

public class InGameScreen extends AbstractScreen {

	private Stage overlayStage;
	private EventManager eventManager;
	private Game game;
	private ShapeRenderer shapeRenderer;

	private SpriteBatch fpsBatch;
	private Label fpsLabel;

	long lastTimeCounted;
	private float frameRate;

	public InGameScreen() {
		overlayStage = new Stage();

		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearEvents();

		this.game = new Game(this);
		eventManager.addListener(MouseMoveListener.class, game);
		eventManager.addListener(LeftClickListener.class, game);
		eventManager.addListener(RightClickListener.class, game);
		eventManager.addListener(PlayerConnectListener.class, game);

		this.shapeRenderer = new ShapeRenderer();
		ShapeRenderEvent.setShapeRenderer(shapeRenderer);

		Label.LabelStyle label1Style = new Label.LabelStyle();
		label1Style.font = Civilization.getInstance().getFont();
		label1Style.fontColor = Color.WHITE;

		this.fpsBatch = new SpriteBatch();
		this.fpsLabel = new Label("FPS: 0", label1Style);
		fpsLabel.setSize(Gdx.graphics.getWidth(), 20);
		fpsLabel.setPosition(4, 4);

		lastTimeCounted = TimeUtils.millis();
		frameRate = Gdx.graphics.getFramesPerSecond();
	}

	@Override
	public void show() {
		super.show();

		getCamera().zoom = 0.8F;
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

		long timeSince = TimeUtils.timeSinceMillis(lastTimeCounted);
		if (timeSince >= 500) {
			frameRate = Gdx.graphics.getFramesPerSecond();
		}

		fpsLabel.setText("FPS: " + frameRate);
		fpsBatch.begin();
		fpsLabel.draw(fpsBatch, 1);
		fpsBatch.end();

		overlayStage.act();
		overlayStage.draw();
	}

	@Override
	public boolean touchUp(int x, int y, int pointer, int button) {
		if (button == Input.Buttons.LEFT)
			Civilization.getInstance().getEventManager().fireEvent(new LeftClickEvent(x, y));

		if (button == Input.Buttons.RIGHT)
			Civilization.getInstance().getEventManager().fireEvent(new RightClickEvent(ClickType.UP, x, y));
		return true;
	}

	@Override
	public boolean touchDown(int x, int y, int pointer, int button) {
		if (button == Input.Buttons.RIGHT)
			Civilization.getInstance().getEventManager().fireEvent(new RightClickEvent(ClickType.DOWN, x, y));

		return true;
	}

	@Override
	public boolean keyUp(int keycode) {
		if (keycode == Input.Keys.G) {
			game.getGameMap().resetTerrain();
			game.getGameMap().generateTerrain();
		}
		return true;
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

	public Stage getOverlayStage() {
		return overlayStage;
	}
}
