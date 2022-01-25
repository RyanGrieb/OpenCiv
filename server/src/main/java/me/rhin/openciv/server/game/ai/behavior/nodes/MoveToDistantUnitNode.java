package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.server.game.unit.Unit;

public class MoveToDistantUnitNode extends Node {

	private Unit unit;

	public MoveToDistantUnitNode(Unit unit) {
		super("MoveToDistantEnemyNode");

		this.unit = unit;
	}

	@Override
	public void tick() {
	}

}
