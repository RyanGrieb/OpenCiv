package me.rhin.openciv.server.game.ai.behavior;

import me.rhin.openciv.server.game.unit.Unit;

public abstract class UnitNode extends Node {

	protected Unit unit;

	public UnitNode(Unit unit, String name) {
		super(name);
		this.unit = unit;
	}
}
