package me.rhin.openciv.server.game.ai.behavior;

public class SequenceNode extends Node {

	public SequenceNode(String name) {
		super(name);
	}

	@Override
	public void tick() {
		for (Node childNode : childNodes) {
			childNode.tick();

			if (childNode.getStatus() == BehaviorStatus.RUNNING) {
				setStatus(BehaviorStatus.RUNNING);
				return;
			}

			if (childNode.getStatus() == BehaviorStatus.FAILURE) {
				setStatus(BehaviorStatus.FAILURE);
				return;
			}
		}

		setStatus(BehaviorStatus.SUCCESS);
	}
}
