package me.rhin.openciv.server.game.ai.behavior;

public class FallbackNode extends Node {

	public FallbackNode(String name) {
		super(name);
	}

	@Override
	public BehaviorResult tick() {

		for (Node childNode : childNodes) {
			BehaviorResult result = childNode.tick();

			if (result.getStatus() == BehaviorStatus.RUNNING) {
				return new BehaviorResult(BehaviorStatus.RUNNING, this);
			} else if (result.getStatus() == BehaviorStatus.SUCCESS) {
				return new BehaviorResult(BehaviorStatus.SUCCESS, this);
			}
		}

		return new BehaviorResult(BehaviorStatus.FAILURE, this);
	}
}
