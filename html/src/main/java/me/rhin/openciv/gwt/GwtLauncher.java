package me.rhin.openciv.gwt;

import com.badlogic.gdx.ApplicationListener;
import com.badlogic.gdx.backends.gwt.GwtApplication;
import com.badlogic.gdx.backends.gwt.GwtApplicationConfiguration;
import com.github.czyzby.websocket.GwtWebSockets;

import me.rhin.openciv.Civilization;

/** Launches the GWT application. */
public class GwtLauncher extends GwtApplication {
	@Override
	public GwtApplicationConfiguration getConfig() {
		// Resizable application, uses available space in browser
		// return new GwtApplicationConfiguration(true);
		// Fixed size application:

		return new GwtApplicationConfiguration(800, 700);
	}

	@Override
	public ApplicationListener createApplicationListener() {
		GwtWebSockets.initiate();
		return new Civilization();
	}
}
