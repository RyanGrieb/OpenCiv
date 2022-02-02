package me.rhin.openciv.logging;

import com.badlogic.gdx.Gdx;

public final class Logger {

	Logger(LoggerType loggerType) {
		this.tag = loggerType.name();
	}

	private final String tag;

	public void debug(String message) {
		Gdx.app.debug(tag, message);
	}

	public void info(String message) {
		Gdx.app.log(tag, message);
	}


	public void error(String message) {
		Gdx.app.error(tag, message);
	}

	public void error(String message, Throwable throwable) {
		Gdx.app.error(tag, message, throwable);
	}

}
