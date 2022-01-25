package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.server.game.unit.Unit;

public class ApproachVunerableCityNode extends Node {

	private Unit unit;

	public ApproachVunerableCityNode(Unit unit) {
		super("ApproachVunerableCityNode");
	}

	@Override
	public void tick() {
	}

}
