package me.rhin.openciv.ui.screen;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.InputMultiplexer;
import com.badlogic.gdx.InputProcessor;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer.ShapeType;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.utils.viewport.StretchViewport;
import com.badlogic.gdx.utils.viewport.Viewport;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.ShapeRenderListener.ShapeRenderEvent;
import me.rhin.openciv.ui.window.WindowManager;

public abstract class AbstractScreen implements Screen, InputProcessor {

	protected WindowManager windowManager;
	protected OrthographicCamera camera;
	protected float camX;
	protected float camY;
	protected Viewport viewport;
	private Viewport overlayViewport;
	protected Stage stage;
	protected Stage overlayStage;
	private InputMultiplexer inputMultiplexer;
	private ShapeRenderer shapeRenderer;

	protected AbstractScreen() {
		this.windowManager = new WindowManager();
		this.camera = new OrthographicCamera();
		// FIXME: Set a global var for width & height for game.
		this.camX = 800 / 2;
		this.camY = 600 / 2;
		this.viewport = new StretchViewport(800, 600, camera);
		this.overlayViewport = new StretchViewport(800, 600);

		this.stage = new Stage(viewport);
		this.overlayStage = new Stage(overlayViewport);

		this.shapeRenderer = new ShapeRenderer();
		ShapeRenderEvent.setShapeRenderer(shapeRenderer);
	}

	@Override
	public void show() {
		inputMultiplexer = new InputMultiplexer();
		inputMultiplexer.addProcessor(stage);
		inputMultiplexer.addProcessor(overlayStage);
		inputMultiplexer.addProcessor(this);
		Gdx.input.setInputProcessor(inputMultiplexer);
	}

	@Override
	public void render(float delta) {
		Gdx.gl.glClearColor(0, 0.253F, 0.304F, 1);
		Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);

		camera.position.x = camX;
		camera.position.y = camY;
		camera.update();

		// Bottom stage
		stage.act();
		stage.draw();

		Gdx.gl.glEnable(GL20.GL_BLEND);
		Gdx.gl.glBlendFunc(GL20.GL_SRC_ALPHA, GL20.GL_ONE_MINUS_SRC_ALPHA);
		shapeRenderer.setProjectionMatrix(camera.combined);
		shapeRenderer.begin(ShapeType.Line);
		Civilization.getInstance().getEventManager().fireEvent(ShapeRenderEvent.INSTANCE);
		shapeRenderer.end();
		Gdx.gl.glDisable(GL20.GL_BLEND);

		// Middle Stage

		// Top Stage

		overlayStage.act();
		overlayStage.draw();

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
		viewport.setScreenSize(width, height);
		viewport.update(width, height, true);
		viewport.setScreenSize(Gdx.graphics.getWidth(), Gdx.graphics.getHeight());

		overlayViewport.setScreenSize(width, height);
		overlayViewport.update(width, height, true);
		overlayViewport.setScreenSize(Gdx.graphics.getWidth(), Gdx.graphics.getHeight());

		stage.getCamera().position.set(stage.getCamera().viewportWidth / 2, stage.getCamera().viewportHeight / 2, 0);
	}

	@Override
	public void dispose() {
		stage.dispose();
		overlayStage.dispose();
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

	public Stage getOverlayStage() {
		return overlayStage;
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
