package me.rhin.openciv.server.game.ai.behavior;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.listener.NodeBehaviorSetListener.NodeBehaviorSetEvent;

public class BehaviorResult {

	private BehaviorStatus behaviorStatus;
	private Node node;

	public BehaviorResult(BehaviorStatus behaviorStatus, Node node) {
		this.behaviorStatus = behaviorStatus;
		this.node = node;

		node.setStatus(behaviorStatus);
		Server.getInstance().getEventManager().fireEvent(new NodeBehaviorSetEvent(node, behaviorStatus));
	}

	public Node getNode() {
		return node;
	}

	public BehaviorStatus getStatus() {
		return behaviorStatus;
	}

}
