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
	public BehaviorResult tick() {

		for (Node childNode : childNodes) {
			BehaviorResult result = childNode.tick();

			if (result.getStatus() == BehaviorStatus.FAILURE) {
				return new BehaviorResult(BehaviorStatus.SUCCESS, this);
			}

			if (result.getStatus() == BehaviorStatus.SUCCESS) {
				return new BehaviorResult(BehaviorStatus.FAILURE, this);
			}
		}

		return new BehaviorResult(BehaviorStatus.UNDEFINED, this);
	}

}
