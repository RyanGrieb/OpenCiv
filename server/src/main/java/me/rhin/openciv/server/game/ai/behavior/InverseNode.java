package me.rhin.openciv.server.game.ai.behavior;

/**
 * Returns the opposite of what the child node returns. Only supports ONE child.
 * 
 * @author Ryan
 *
 */
public class InverseNode extends Node {

	public InverseNode(String name) {
		super(name);
	}

	@Override
	public void tick() {

		for (Node childNode : childNodes) {
			childNode.tick();

			if (childNode.getStatus() == BehaviorStatus.FAILURE) {
				setStatus(BehaviorStatus.SUCCESS);
				return;
			}

			if (childNode.getStatus() == BehaviorStatus.SUCCESS) {
				setStatus(BehaviorStatus.FAILURE);
				return;
			}
		}

		setStatus(BehaviorStatus.UNDEFINED);
	}

}
