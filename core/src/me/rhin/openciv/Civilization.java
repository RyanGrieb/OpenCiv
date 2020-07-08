package me.rhin.openciv;

import com.badlogic.gdx.Application;
import com.badlogic.gdx.Game;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.profiling.GLProfiler;

import me.rhin.openciv.asset.AssetHandler;
import me.rhin.openciv.game.CivGame;
import me.rhin.openciv.networking.NetworkManager;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.font.FontHandler;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.screen.ScreenEnum;
import me.rhin.openciv.ui.screen.ScreenManager;
import me.rhin.openciv.ui.screen.type.InGameScreen;
import me.rhin.openciv.ui.window.WindowManager;

public class Civilization extends Game {

	public static final boolean DEBUG_GL = false;
	public static final String LOG_TAG = "OpenCiv-INFO";
	public static final String WS_LOG_TAG = "OpenCiv-WebSocket";
	public static GLProfiler GL_PROFILER;

	public static Civilization instance;

	private AssetHandler assetHandler;
	private EventManager eventManager;
	private ScreenManager screenManager;
	private NetworkManager networkManager;
	private FontHandler fontHandler;

	public static Civilization getInstance() {
		return instance;
	}

	@Override
	public void create() {
		Gdx.app.setLogLevel(Application.LOG_INFO);
		Gdx.app.log(LOG_TAG, "Starting Game...");
		GL_PROFILER = new GLProfiler(Gdx.graphics);
		if (DEBUG_GL) {
			GL_PROFILER.enable();
		}
		assetHandler = new AssetHandler();
		eventManager = new EventManager();
		screenManager = new ScreenManager();
		networkManager = new NetworkManager();
		fontHandler = new FontHandler();
		instance = this;

		screenManager.setScreen(ScreenEnum.LOADING);
	}

	@Override
	public void dispose() {
		super.dispose();
		GL_PROFILER.disable();
		networkManager.disconnect();
	}

	public AssetHandler getAssetHandler() {
		return assetHandler;
	}

	public EventManager getEventManager() {
		return eventManager;
	}

	public ScreenManager getScreenManager() {
		return screenManager;
	}

	public NetworkManager getNetworkManager() {
		return networkManager;
	}

	public AbstractScreen getCurrentScreen() {
		return screenManager.getCurrentScreen();
	}

	public OrthographicCamera getCamera() {
		return screenManager.getCurrentScreen().getCamera();
	}

	public WindowManager getWindowManager() {
		return screenManager.getCurrentScreen().getWindowManager();
	}

	// FIXME: We really shouldn't be casting a specific screen here
	public CivGame getGame() {
		return ((InGameScreen) screenManager.getCurrentScreen()).getGame();
	}

	public FontHandler getFontHandler() {
		return fontHandler;
	}
}
