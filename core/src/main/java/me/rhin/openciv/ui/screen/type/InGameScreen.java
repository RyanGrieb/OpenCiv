package me.rhin.openciv.ui.screen.type;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.utils.TimeUtils;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.CivGame;
import me.rhin.openciv.listener.LeftClickListener.LeftClickEvent;
import me.rhin.openciv.listener.MouseMoveListener.MouseMoveEvent;
import me.rhin.openciv.listener.RelativeMouseMoveListener.RelativeMouseMoveEvent;
import me.rhin.openciv.listener.RightClickListener.RightClickEvent;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.button.type.NextTurnButton;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.screen.ScreenEnum;
import me.rhin.openciv.ui.window.type.EscWindow;
import me.rhin.openciv.ui.window.type.GameOverlay;
import me.rhin.openciv.util.ClickType;

public class InGameScreen extends AbstractScreen {

	private GameOverlay gameOverlay;
	private EventManager eventManager;
	private CivGame game;
	private Group tileGroup;
	private Group riverGroup;
	private Group unitGroup;

	long lastTimeCounted;
	private float frameRate;

	public InGameScreen() {
		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearEvents();

		lastTimeCounted = TimeUtils.millis();
		frameRate = Gdx.graphics.getFramesPerSecond();

		this.tileGroup = new Group();
		this.riverGroup = new Group();
		this.unitGroup = new Group();

		stage.addActor(tileGroup);
		stage.addActor(riverGroup);
		stage.addActor(unitGroup);
	}

	@Override
	public void show() {
		super.show();
		this.game = new CivGame();

		this.gameOverlay = new GameOverlay();
		overlayStage.addActor(gameOverlay);

		getCamera().zoom = 0.6F; // 0.8 Default
	}

	@Override
	public void render(float delta) {
		super.render(delta);

		camera.position.x = camX;
		camera.position.y = camY;
		camera.update();

		handleInput();

		Civilization.getInstance().getEventManager().fireEvent(MouseMoveEvent.INSTANCE);
		Civilization.getInstance().getEventManager().fireEvent(RelativeMouseMoveEvent.INSTANCE);

		long timeSince = TimeUtils.timeSinceMillis(lastTimeCounted);
		if (timeSince >= 500) {
			frameRate = Gdx.graphics.getFramesPerSecond();
			gameOverlay.getFPSLabel().setText("FPS: " + frameRate);
		}
	}

	@Override
	public void dispose() {
		super.dispose();
		Civilization.getInstance().getNetworkManager().disconnect();
	}

	@Override
	public boolean touchUp(int x, int y, int pointer, int button) {
		if (!windowManager.allowsInput())
			return false;

		if (button == Input.Buttons.LEFT)
			Civilization.getInstance().getEventManager().fireEvent(new LeftClickEvent(x, y));

		if (button == Input.Buttons.RIGHT)
			Civilization.getInstance().getEventManager().fireEvent(new RightClickEvent(ClickType.UP, x, y));

		return false;
	}

	@Override
	public boolean touchDown(int x, int y, int pointer, int button) {
		if (!windowManager.allowsInput())
			return false;

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

		if (keycode == Input.Keys.ESCAPE) {
			windowManager.toggleWindow(new EscWindow());
		}

		return false;
	}

	private void handleInput() {

		if (Gdx.input.isKeyJustPressed(Input.Keys.SPACE)) {
			game.endTurn();
		}

		if (!windowManager.allowsInput())
			return;

		if (!windowManager.allowsCameraMovement()) {
			return;
		}

		OrthographicCamera cam = getCamera();
		if (Gdx.input.isKeyPressed(Input.Keys.EQUALS) || Gdx.input.isKeyPressed(Input.Keys.P)) {
			cam.zoom += 0.04;
			System.out.println(cam.zoom);
			if(cam.zoom > 0.6F) {
				//game.getGameSounds().playSkyAmbience();
			}
		}

		if (Gdx.input.isKeyPressed(Input.Keys.MINUS) || Gdx.input.isKeyPressed(Input.Keys.O)) {
			cam.zoom -= 0.04;
			System.out.println(cam.zoom);
			if(cam.zoom < 0.4F) {
				//game.getGameSounds().playTileAmbience();
			}
		}
		if (Gdx.input.isKeyPressed(Input.Keys.A) || Gdx.input.isKeyPressed(Input.Keys.LEFT)) {
			tanslateCamera(-6, 0, 0);
		}
		if (Gdx.input.isKeyPressed(Input.Keys.D) || Gdx.input.isKeyPressed(Input.Keys.RIGHT)) {
			tanslateCamera(6, 0, 0);
		}
		if (Gdx.input.isKeyPressed(Input.Keys.S) || Gdx.input.isKeyPressed(Input.Keys.DOWN)) {
			tanslateCamera(0, -6, 0);
		}
		if (Gdx.input.isKeyPressed(Input.Keys.W) || Gdx.input.isKeyPressed(Input.Keys.UP)) {
			tanslateCamera(0, 6, 0);
		}

	}

	public CivGame getGame() {
		return game;
	}

	public GameOverlay getGameOverlay() {
		return gameOverlay;
	}

	public Group getTileGroup() {
		return tileGroup;
	}

	public Group getRiverGroup() {
		return riverGroup;
	}

	public Group getUnitGroup() {
		return unitGroup;
	}

	@Override
	public ScreenEnum getType() {
		return ScreenEnum.IN_GAME;
	}
}
