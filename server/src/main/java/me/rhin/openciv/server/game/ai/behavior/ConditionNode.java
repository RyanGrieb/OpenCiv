package me.rhin.openciv.server.game.ai.behavior;

public abstract class ConditionNode extends Node {

	public ConditionNode(String name) {
		super(name);
	}

	@Override
	public void tick() {
		if (getStatus() == BehaviorStatus.SUCCESS) {
			for (Node childNode : childNodes) {
				childNode.tick();
			}
		}
	}
}
