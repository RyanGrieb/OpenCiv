package me.rhin.openciv.server.events.type;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.shared.listener.Event;

public class NodeBehaviorSetEvent implements Event {

	private Node node;
	private BehaviorStatus behaviorStatus;

	public NodeBehaviorSetEvent(Node node, BehaviorStatus behaviorStatus) {
		this.node = node;
		this.behaviorStatus = behaviorStatus;
	}

	@Override
	public String getMethodName() {
		return "onNodeBehaviorSet";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { node, behaviorStatus };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { node.getClass(), behaviorStatus.getClass() };
	}

}
