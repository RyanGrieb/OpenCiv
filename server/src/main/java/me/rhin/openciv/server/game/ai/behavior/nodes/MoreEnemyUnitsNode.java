package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.server.game.unit.Unit;

public class MoreEnemyUnitsNode extends Node {

	private Unit unit;

	public MoreEnemyUnitsNode(Unit unit) {
		super("MoreEnemyUnitsNode");
	}

	@Override
	public void tick() {

	}
}
