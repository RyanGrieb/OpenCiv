package me.rhin.openciv.server.game.ai.behavior;

public class SequenceNode extends Node {

	public SequenceNode(String name) {
		super(name);
	}

	@Override
	public BehaviorResult tick() {

		for (Node childNode : childNodes) {

			BehaviorResult result = childNode.tick();

			if (result.getStatus() == BehaviorStatus.RUNNING) {
				return new BehaviorResult(BehaviorStatus.RUNNING, this);
			}

			if (result.getStatus() == BehaviorStatus.FAILURE) {
				return new BehaviorResult(BehaviorStatus.FAILURE, this);
			}
		}

		return new BehaviorResult(BehaviorStatus.SUCCESS, this);
	}
}
