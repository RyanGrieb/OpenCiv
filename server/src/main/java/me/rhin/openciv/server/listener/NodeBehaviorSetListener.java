package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface NodeBehaviorSetListener extends Listener {

	public void onNodeBehaviorSet(Node node, BehaviorStatus behavior);

	public static class NodeBehaviorSetEvent extends Event<NodeBehaviorSetListener> {

		private Node node;
		private BehaviorStatus behavior;

		public NodeBehaviorSetEvent(Node node, BehaviorStatus behavior) {
			this.node = node;
			this.behavior = behavior;
		}

		@Override
		public void fire(ArrayList<NodeBehaviorSetListener> listeners) {
			for (NodeBehaviorSetListener listener : listeners) {
				listener.onNodeBehaviorSet(node, behavior);
			}
		}

		@Override
		public Class<NodeBehaviorSetListener> getListenerType() {
			return NodeBehaviorSetListener.class;
		}

	}
}
