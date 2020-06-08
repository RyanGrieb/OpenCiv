package me.rhin.openciv;

import com.badlogic.gdx.Application;
import com.badlogic.gdx.Game;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.profiling.GLProfiler;

import me.rhin.openciv.asset.AssetHandler;
import me.rhin.openciv.networking.NetworkManager;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.font.CustomFont;
import me.rhin.openciv.ui.screen.ScreenEnum;
import me.rhin.openciv.ui.screen.ScreenManager;

public class Civilization extends Game {

	public static final boolean DEBUG_GL = false;
	public static final String LOG_TAG = "OpenCiv-INFO";
	public static GLProfiler GL_PROFILER;

	public static Civilization instance;

	private AssetHandler assetHandler;
	private EventManager eventManager;
	private ScreenManager screenManager;
	private CustomFont customFont;
	private NetworkManager networkManager;

	@Override
	public void create() {
		Gdx.app.setLogLevel(Application.LOG_INFO);
		Gdx.app.log(LOG_TAG, "Starting...");
		GL_PROFILER = new GLProfiler(Gdx.graphics);
		GL_PROFILER.enable();
		assetHandler = new AssetHandler();
		eventManager = new EventManager();
		screenManager = new ScreenManager();
		customFont = new CustomFont();
		networkManager = new NetworkManager();
		instance = this;

		screenManager.setScreen(ScreenEnum.LOADING);
	}

	@Override
	public void dispose() {
		GL_PROFILER.disable();
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

	public BitmapFont getFont() {
		return customFont.getFont();
	}

	public NetworkManager getNetworkManager() {
		return networkManager;
	}

	public OrthographicCamera getCamera() {
		return screenManager.getCurrentScreen().getCamera();
	}

	public static Civilization getInstance() {
		return instance;
	}

}
