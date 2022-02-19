package me.rhin.openciv.server.game.ai.behavior;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import me.rhin.openciv.server.game.unit.Unit;

public abstract class UnitNode extends Node {

	private static final Logger LOGGER = LoggerFactory.getLogger(UnitNode.class);

	protected Unit unit;

	public UnitNode(Unit unit, String name) {
		super(name);
		this.unit = unit;
	}
}
