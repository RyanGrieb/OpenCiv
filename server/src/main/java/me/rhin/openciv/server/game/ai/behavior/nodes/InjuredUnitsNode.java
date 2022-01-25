package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.server.game.unit.Unit;

public class InjuredUnitsNode extends Node {

	private Unit unit;

	public InjuredUnitsNode(Unit unit) {
		super("");
	}

	@Override
	public void tick() {
	}

}
