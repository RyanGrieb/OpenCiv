package me.rhin.openciv.ui.screen.type;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.utils.TimeUtils;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.events.type.LeftClickEvent;
import me.rhin.openciv.events.type.RelativeMouseMoveEvent;
import me.rhin.openciv.events.type.RightClickEvent;
import me.rhin.openciv.game.CivGame;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.screen.ScreenEnum;
import me.rhin.openciv.ui.window.type.ChatboxWindow;
import me.rhin.openciv.ui.window.type.EscWindow;
import me.rhin.openciv.ui.window.type.GameOverlay;
import me.rhin.openciv.util.ClickType;

public class InGameScreen extends AbstractScreen {

	private static final float ZOOM_LEVEL = 0.08F;
	private static final float MAX_ZOOM_LEVEL = 0.12F;

	private GameOverlay gameOverlay;
	private CivGame game;
	private final Group bottomTileGroup;
	private final Group topTileGroup;
	private final Group riverGroup;
	private final Group mainUnitGroup;
	private final Group supportUnitGroup;
	private final Group territoryGroup;
	private final Group combatTooltipGroup;
	private Vector2 dragOrigin;
	private boolean rightClicking;

	long lastTimeCounted;
	private float frameRate;

	public InGameScreen() {

		EventManager eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearListeners();

		lastTimeCounted = TimeUtils.millis();
		frameRate = Gdx.graphics.getFramesPerSecond();

		this.bottomTileGroup = new Group();
		this.topTileGroup = new Group();
		this.riverGroup = new Group();
		this.mainUnitGroup = new Group();
		this.supportUnitGroup = new Group();
		this.territoryGroup = new Group();
		this.combatTooltipGroup = new Group();

		stage.addActor(bottomTileGroup);
		stage.addActor(riverGroup);
		stage.addActor(topTileGroup);
		stage.addActor(territoryGroup);
		stage.addActor(supportUnitGroup);
		stage.addActor(mainUnitGroup);
		stage.addActor(combatTooltipGroup);
	}

	public static float getZoomLevel() {
		return ZOOM_LEVEL;
	}

	public static float getMaxZoomLevel() {
		return MAX_ZOOM_LEVEL;
	}

	public Vector2 getDragOrigin() {
		return dragOrigin;
	}

	public boolean isRightClicking() {
		return rightClicking;
	}

	public long getLastTimeCounted() {
		return lastTimeCounted;
	}

	public float getFrameRate() {
		return frameRate;
	}

	@Override
	public void show() {
		super.show();
		this.game = new CivGame();

		this.gameOverlay = new GameOverlay();
		overlayStage.addActor(gameOverlay);

		getCamera().zoom = 0.4F; // 0.8 Default
	}

	@Override
	public void render(float delta) {
		super.render(delta);

		camera.position.x = camX;
		camera.position.y = camY;
		camera.update();

		handleInput();

		if (RelativeMouseMoveEvent.hasMouseMoved())
			Civilization.getInstance().getEventManager().fireEvent(RelativeMouseMoveEvent.INSTANCE);

		long timeSince = TimeUtils.timeSinceMillis(lastTimeCounted);
		if (timeSince >= 500) {
			frameRate = Gdx.graphics.getFramesPerSecond();
			gameOverlay.setFPSText("FPS: " + frameRate);
		}
	}

	@Override
	public void dispose() {
		super.dispose();
		Civilization.getInstance().getNetworkManager().disconnect();
	}

	@Override
	public boolean touchUp(int x, int y, int pointer, int button) {

		dragOrigin = null;

		if (!windowManager.allowsInput())
			return false;

		if (button == Input.Buttons.LEFT)
			Civilization.getInstance().getEventManager().fireEvent(new LeftClickEvent(x, y));

		if (button == Input.Buttons.RIGHT) {
			Civilization.getInstance().getEventManager().fireEvent(new RightClickEvent(ClickType.UP, x, y));
			rightClicking = false;
		}

		return false;
	}

	@Override
	public boolean touchDown(int x, int y, int pointer, int button) {

		if (!windowManager.allowsInput())
			return false;

		if (button == Input.Buttons.RIGHT) {
			Civilization.getInstance().getEventManager().fireEvent(new RightClickEvent(ClickType.DOWN, x, y));
			rightClicking = true;
		}
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

	@Override
	public boolean touchDragged(int screenX, int screenY, int pointer) {

		if (rightClicking)
			return false;

		if (!windowManager.allowsInput())
			return false;

		if (!windowManager.allowsCameraMovement()) {
			return false;
		}

		// Get the original point of drag. and offset the camera based on the
		// difference.
		if (dragOrigin == null) {
			dragOrigin = new Vector2(screenX, screenY);
		}

		int xDiff = (int) ((dragOrigin.x - screenX) / 1.8);
		int yDiff = (int) ((screenY - dragOrigin.y) / 1.8);

		translateCamera(xDiff, yDiff, 0);
		dragOrigin.x -= xDiff;
		dragOrigin.y += yDiff;
		return false;
	}

	@Override
	public boolean scrolled(float amountX, float amountY) {
		super.scrolled(amountX, amountY);

		if (!windowManager.allowsInput())
			return false;

		if (!windowManager.allowsCameraMovement()) {
			return false;
		}

		OrthographicCamera cam = getCamera();

		if (!canZoomIn(cam) && amountY < 0) {
			return false;
		}
		cam.zoom += ZOOM_LEVEL * amountY;
		return false;
	}

	@Override
	public ScreenEnum getType() {
		return ScreenEnum.IN_GAME;
	}

	public CivGame getGame() {
		return game;
	}

	public GameOverlay getGameOverlay() {
		return gameOverlay;
	}

	public Group getMainUnitGroup() {
		return mainUnitGroup;
	}

	public Group getSupportUnitGroup() {
		return supportUnitGroup;
	}

	public Group getRiverGroup() {
		return riverGroup;
	}

	public Group getCombatTooltipGroup() {
		return combatTooltipGroup;
	}

	public Group getTerritoryGroup() {
		return territoryGroup;
	}

	private void handleInput() {

		if (Gdx.input.isKeyJustPressed(Input.Keys.SPACE) && !windowManager.isOpenWindow(ChatboxWindow.class)) {
			game.endTurn();
		}

		if (!windowManager.allowsInput())
			return;

		if (!windowManager.allowsCameraMovement()) {
			return;
		}

		OrthographicCamera cam = getCamera();
		if (Gdx.input.isKeyPressed(Input.Keys.EQUALS) || Gdx.input.isKeyPressed(Input.Keys.P)) {
			cam.zoom += ZOOM_LEVEL;
			if (cam.zoom > 0.6F) {
				// game.getGameSounds().playSkyAmbience();
			}
		}

		if (canZoomIn(cam) && (Gdx.input.isKeyPressed(Input.Keys.MINUS) || Gdx.input.isKeyPressed(Input.Keys.O))) {
			cam.zoom -= ZOOM_LEVEL;
			if (cam.zoom < 0.4F) {
				// game.getGameSounds().playTileAmbience();
			}
		}

		float speed = 6 * (Gdx.graphics.getDeltaTime() * 60);

		if (Gdx.input.isKeyPressed(Input.Keys.A) || Gdx.input.isKeyPressed(Input.Keys.LEFT)) {
			translateCamera(-speed, 0, 0);
		}
		if (Gdx.input.isKeyPressed(Input.Keys.D) || Gdx.input.isKeyPressed(Input.Keys.RIGHT)) {
			translateCamera(speed, 0, 0);
		}
		if (Gdx.input.isKeyPressed(Input.Keys.S) || Gdx.input.isKeyPressed(Input.Keys.DOWN)) {
			translateCamera(0, -speed, 0);
		}
		if (Gdx.input.isKeyPressed(Input.Keys.W) || Gdx.input.isKeyPressed(Input.Keys.UP)) {
			translateCamera(0, speed, 0);
		}
	}

	private boolean canZoomIn(OrthographicCamera camera) {
		return camera.zoom - ZOOM_LEVEL > MAX_ZOOM_LEVEL;
	}

	public Group getBottomTileGroup() {
		return bottomTileGroup;
	}

	public Group getTopTileGroup() {
		return topTileGroup;
	}

}
