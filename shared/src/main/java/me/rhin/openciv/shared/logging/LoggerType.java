package me.rhin.openciv.shared.logging;

public enum LoggerType {

	LOG_TAG("OpenCiv"),
	WS_LOG_TAG("OpenCiv-WebSocket");

	LoggerType(String type) {
		this.type = type;
	}

	private final String type;

	public String getType() {
		return type;
	}
}
