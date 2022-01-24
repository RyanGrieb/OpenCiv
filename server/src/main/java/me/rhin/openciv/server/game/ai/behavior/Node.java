package me.rhin.openciv.server.game.ai.behavior;

import java.util.ArrayList;

public abstract class Node {

	protected String name;
	protected ArrayList<Node> childNodes;
	private BehaviorStatus status;

	public Node(String name) {
		this.name = name;
		childNodes = new ArrayList<>();
		status = BehaviorStatus.UNDEFINED;
	}

	public abstract void tick();

	public void addChild(Node node) {
		childNodes.add(node);
	}

	public void setStatus(BehaviorStatus status) {
		this.status = status;
	}

	public BehaviorStatus getStatus() {
		return status;
	}

	public String getName() {
		return name;
	}
}
