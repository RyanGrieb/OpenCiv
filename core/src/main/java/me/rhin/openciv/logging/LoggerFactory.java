package me.rhin.openciv.logging;

public final class LoggerFactory {

	public static Logger getInstance(LoggerType loggerType) {
		return new Logger(loggerType);
	}

}
