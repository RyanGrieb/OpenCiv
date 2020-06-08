package me.rhin.openciv.desktop;

import com.badlogic.gdx.backends.lwjgl.LwjglApplication;
import com.badlogic.gdx.backends.lwjgl.LwjglApplicationConfiguration;
import com.github.czyzby.websocket.CommonWebSockets;

import me.rhin.openciv.Civilization;

public class DesktopLauncher {
	public static void main(String[] arg) {
		CommonWebSockets.initiate();
		LwjglApplicationConfiguration config = new LwjglApplicationConfiguration();
		config.width = 800;
		config.height = 600;
		config.title = "OpenCiv";
		new LwjglApplication(new Civilization(), config);
	}
}
