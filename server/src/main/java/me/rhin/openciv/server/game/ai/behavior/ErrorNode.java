package me.rhin.openciv.server.game.ai.behavior;

import me.rhin.openciv.shared.logging.Logger;
import me.rhin.openciv.shared.logging.LoggerFactory;
import me.rhin.openciv.shared.logging.LoggerType;

public class ErrorNode extends Node {

	private static final Logger LOGGER = LoggerFactory.getInstance(LoggerType.LOG_TAG);

	public ErrorNode() {
		super("ErrorNode");
	}

	@Override
	public void tick() {
		LOGGER.info("Error node called");
	}

}
