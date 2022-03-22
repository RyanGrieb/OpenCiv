package me.rhin.openciv;

import com.badlogic.gdx.Application;
import com.badlogic.gdx.Game;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.profiling.GLProfiler;

import me.rhin.openciv.asset.AssetHandler;
import me.rhin.openciv.asset.sound.SoundHandler;
import me.rhin.openciv.game.CivGame;
import me.rhin.openciv.shared.logging.Logger;
import me.rhin.openciv.shared.logging.LoggerFactory;
import me.rhin.openciv.shared.logging.LoggerType;
import me.rhin.openciv.networking.NetworkManager;
import me.rhin.openciv.networking.chat.ChatHandler;
import me.rhin.openciv.options.GameOptions;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.font.FontHandler;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.screen.ScreenEnum;
import me.rhin.openciv.ui.screen.ScreenManager;
import me.rhin.openciv.ui.screen.type.InGameScreen;
import me.rhin.openciv.ui.window.WindowManager;

public class Civilization extends Game {

	private static final Logger LOGGER = LoggerFactory.getInstance(LoggerType.LOG_TAG);

	public static final boolean SHOW_FOG = true;
	public static final boolean DEBUG_GL = false;
	public static final boolean DEBUG_BOUNDING_BOXES = false; // NOTE: Overlay only.

	private static Civilization instance;

	private GLProfiler profiler;
	private AssetHandler assetHandler;
	private EventManager eventManager;
	private ScreenManager screenManager;
	private NetworkManager networkManager;
	private FontHandler fontHandler;
	private SoundHandler soundHandler;
	private ChatHandler chatHandler;
	private GameOptions gameOptions;

	public static final Civilization getInstance() {
		return instance;
	}

	@Override
	public void create() {
		Gdx.app.setLogLevel(Application.LOG_INFO);
		LOGGER.info("Starting Game...");
		if (DEBUG_GL) {
			profiler = new GLProfiler(Gdx.graphics);
		}
		assetHandler = new AssetHandler();
		eventManager = new EventManager();
		screenManager = new ScreenManager();
		networkManager = new NetworkManager();
		fontHandler = new FontHandler();
		gameOptions = new GameOptions();
		instance = this;

		soundHandler = new SoundHandler();
		chatHandler = new ChatHandler();

		screenManager.setScreen(ScreenEnum.LOADING);
	}

	@Override
	public void dispose() {
		super.dispose();
		profiler.disable();
		networkManager.disconnect();
	}

	public GLProfiler getProfiler() {
		return profiler;
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

	public SoundHandler getSoundHandler() {
		return soundHandler;
	}

	public ChatHandler getChatHandler() {
		return chatHandler;
	}

	public GameOptions getGameOptions() {
		return gameOptions;
	}
}