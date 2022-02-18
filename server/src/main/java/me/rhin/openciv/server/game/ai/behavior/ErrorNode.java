package me.rhin.openciv.server.game.ai.behavior;

import me.rhin.openciv.shared.logging.LoggerType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ErrorNode extends Node {

	private static final Logger LOGGER = LoggerFactory.getLogger(ErrorNode.class);

	public ErrorNode() {
		super("ErrorNode");
	}

	@Override
	public void tick() {
		LOGGER.info("Error node called");
	}

}
