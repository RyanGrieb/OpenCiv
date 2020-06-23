package me.rhin.openciv.ui.screen;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.InputMultiplexer;
import com.badlogic.gdx.InputProcessor;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.utils.viewport.StretchViewport;
import com.badlogic.gdx.utils.viewport.Viewport;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.window.WindowManager;

public abstract class AbstractScreen implements Screen, InputProcessor {

	protected WindowManager windowManager;
	protected OrthographicCamera camera;
	protected float camX;
	protected float camY;
	// TODO: Make a overlayViewport.
	protected Viewport viewport;
	protected Stage stage;
	private InputMultiplexer inputMultiplexer;
	private boolean glClear;

	protected AbstractScreen() {
		this.windowManager = new WindowManager();
		camera = new OrthographicCamera();
		// FIXME: Set a global var for width & height for game.
		this.camX = 800 / 2;
		this.camY = 600 / 2;
		viewport = new StretchViewport(800, 600, camera);
		stage = new Stage(viewport);
		viewport.apply();

		this.glClear = true;
	}

	@Override
	public void show() {
		// Input processor for MY stuff
		InputProcessor screenInputProcessor = this;
		// Input processor for libgdx stuff
		InputProcessor stageInputProcessor = stage;
		inputMultiplexer = new InputMultiplexer();
		inputMultiplexer.addProcessor(stageInputProcessor);
		inputMultiplexer.addProcessor(screenInputProcessor);
		Gdx.input.setInputProcessor(inputMultiplexer);
	}

	@Override
	public void render(float delta) {
		if (glClear) {
			Gdx.gl.glClearColor(0, 0.253F, 0.304F, 1);
			Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);
		}

		camera.position.x = camX;
		camera.position.y = camY;
		camera.update();

		stage.act();
		stage.draw();

		if (Civilization.DEBUG_GL) {
			System.out.println("  Drawcalls: " + Civilization.GL_PROFILER.getDrawCalls() + ", Calls: "
					+ Civilization.GL_PROFILER.getCalls() + ", TextureBindings: "
					+ Civilization.GL_PROFILER.getTextureBindings() + ", ShaderSwitches: "
					+ Civilization.GL_PROFILER.getShaderSwitches() + ", VertexCount: "
					+ Civilization.GL_PROFILER.getVertexCount().value);
			Civilization.GL_PROFILER.reset();
		}
	}

	@Override
	public void resize(int width, int height) {
		windowManager.onResize(width, height);
		viewport.setScreenSize(width, height);
		viewport.update(width, height, true);
		viewport.setScreenSize(Gdx.graphics.getWidth(), Gdx.graphics.getHeight());
		// stage.getCamera().viewportWidth = Gdx.graphics.getWidth();
		// stage.getCamera().viewportHeight = Gdx.graphics.getHeight();
		stage.getCamera().position.set(stage.getCamera().viewportWidth / 2, stage.getCamera().viewportHeight / 2, 0);
	}

	@Override
	public void dispose() {
		stage.dispose();
	}

	@Override
	public void hide() {
		Gdx.input.setInputProcessor(null);
	}

	@Override
	public void pause() {

	}

	@Override
	public void resume() {

	}

	@Override
	public boolean keyDown(int keycode) {
		return false;
	}

	@Override
	public boolean keyUp(int keycode) {
		return false;
	}

	@Override
	public boolean keyTyped(char character) {
		return false;
	}

	@Override
	public boolean touchDown(int screenX, int screenY, int pointer, int button) {
		return false;
	}

	@Override
	public boolean touchUp(int screenX, int screenY, int pointer, int button) {
		return false;
	}

	@Override
	public boolean touchDragged(int screenX, int screenY, int pointer) {
		return false;
	}

	@Override
	public boolean mouseMoved(int screenX, int screenY) {
		return false;
	}

	@Override
	public boolean scrolled(int amount) {
		return false;
	}

	public void overrideGlClear() {
		glClear = false;
	}

	public void setCameraPosition(float camX, float camY) {
		this.camX = camX;
		this.camY = camY;
	}

	public void tanslateCamera(int x, int y, int z) {
		camX += x;
		camY += y;
	}

	public Viewport getViewport() {
		return viewport;
	}

	public Stage getStage() {
		return stage;
	}

	public OrthographicCamera getCamera() {
		return camera;
	}

	public InputMultiplexer getInputMultiplexer() {
		return inputMultiplexer;
	}

	public WindowManager getWindowManager() {
		return windowManager;
	}
}
