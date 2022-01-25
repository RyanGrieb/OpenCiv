package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.server.game.unit.Unit;

public class ApproachEnemyCityNode extends Node {

	private Unit unit;
	
	public ApproachEnemyCityNode(Unit unit) {
		super("ApproachEnemyCityNode");
	}

	@Override
	public void tick() {
	}

}
