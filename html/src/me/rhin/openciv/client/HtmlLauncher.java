package me.rhin.openciv.client;

import com.badlogic.gdx.ApplicationListener;
import com.badlogic.gdx.backends.gwt.GwtApplication;
import com.badlogic.gdx.backends.gwt.GwtApplicationConfiguration;
import com.github.czyzby.websocket.GwtWebSockets;

import me.rhin.openciv.Civilization;

public class HtmlLauncher extends GwtApplication {

	@Override
	public GwtApplicationConfiguration getConfig() {
		GwtWebSockets.initiate();
		return new GwtApplicationConfiguration(800, 600);
	}

	@Override
	public ApplicationListener createApplicationListener() {
		return new Civilization();
	}
}