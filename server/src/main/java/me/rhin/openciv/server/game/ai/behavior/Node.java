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

	public abstract BehaviorResult tick();

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

	public ArrayList<Node> getChildNodes() {
		return childNodes;
	}

	public boolean hasChild(Node node) {

		for (Node childNode : getNodeTree()) {
			if (childNode.equals(node))
				return true;
		}

		return false;
	}

	private ArrayList<Node> getNodeTree() {
		ArrayList<Node> nodeTree = new ArrayList<>();

		defineTree(nodeTree, this);
		return nodeTree;
	}

	private void defineTree(ArrayList<Node> nodeTree, Node node) {
		for (Node childNode : node.getChildNodes()) {

			if (childNode.getChildNodes().size() > 0)
				defineTree(nodeTree, childNode);

			nodeTree.add(childNode);
		}
	}
}
