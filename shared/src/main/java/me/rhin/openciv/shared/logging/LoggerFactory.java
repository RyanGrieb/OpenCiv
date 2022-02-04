package me.rhin.openciv.shared.logging;

public final class LoggerFactory {

	public static Logger getInstance(LoggerType loggerType) {
		return new Logger(loggerType);
	}

}
