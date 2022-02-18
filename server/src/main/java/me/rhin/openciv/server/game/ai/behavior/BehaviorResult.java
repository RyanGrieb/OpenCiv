package me.rhin.openciv.server.game.ai.behavior;

public class BehaviorResult {

	private BehaviorStatus behaviorStatus;
	private Node node;

	public BehaviorResult(BehaviorStatus behaviorStatus, Node node) {
		this.behaviorStatus = behaviorStatus;
		this.node = node;
	}

	public BehaviorStatus getBehaviorStatus() {
		return behaviorStatus;
	}

	public Node getNode() {
		return node;
	}

}
