package me.rhin.openciv.server.game.ai.behavior;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ErrorNode extends Node {

	private static final Logger LOGGER = LoggerFactory.getLogger(ErrorNode.class);

	public ErrorNode() {
		super("ErrorNode");
	}

	@Override
	public BehaviorResult tick() {
		LOGGER.info("Error node called");
		return new BehaviorResult(BehaviorStatus.SUCCESS, this);
	}

}
