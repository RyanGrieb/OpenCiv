package me.rhin.openciv.lwjgl3;

import com.badlogic.gdx.Files.FileType;
import com.badlogic.gdx.backends.lwjgl.LwjglApplication;
import com.badlogic.gdx.backends.lwjgl.LwjglApplicationConfiguration;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3Application;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3ApplicationConfiguration;
import com.github.czyzby.websocket.CommonWebSockets;

import me.rhin.openciv.Civilization;

/** Launches the desktop (LWJGL3) application. */
public class Lwjgl3Launcher {
	public static void main(String[] args) {

		CommonWebSockets.initiate();

		createApplication();
		LwjglApplicationConfiguration config = new LwjglApplicationConfiguration();

		new LwjglApplication(new Civilization(), config);
	}

	private static Lwjgl3Application createApplication() {
		return new Lwjgl3Application(new Civilization(), getDefaultConfiguration());
	}

	private static Lwjgl3ApplicationConfiguration getDefaultConfiguration() {
		Lwjgl3ApplicationConfiguration config = new Lwjgl3ApplicationConfiguration();
		config.useVsync(true);
		config.setWindowSizeLimits(900, 750, -1, -1);
		config.setTitle("OpenCiv");
		config.setWindowIcon(FileType.Internal, "tile_city.png");
		config.setIdleFPS(60);
		return config;
	}
}