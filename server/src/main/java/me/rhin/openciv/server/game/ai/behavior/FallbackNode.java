package me.rhin.openciv.server.game.ai.behavior;

public class FallbackNode extends Node {

	public FallbackNode(String name) {
		super(name);
	}

	@Override
	public void tick() {

		for (Node childNode : childNodes) {
			childNode.tick();

			if (childNode.getStatus() == BehaviorStatus.RUNNING) {
				setStatus(BehaviorStatus.RUNNING);
				return;
			} else if (childNode.getStatus() == BehaviorStatus.SUCCESS) {
				setStatus(BehaviorStatus.SUCCESS);
				return;
			}
		}
		setStatus(BehaviorStatus.FAILURE);
	}
}
