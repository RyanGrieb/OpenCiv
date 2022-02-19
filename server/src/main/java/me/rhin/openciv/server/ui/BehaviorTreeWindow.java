package me.rhin.openciv.server.ui;

import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

import javax.swing.JFrame;
import javax.swing.JLabel;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.server.listener.NodeBehaviorSetListener;

public class BehaviorTreeWindow extends JFrame implements NextTurnListener, NodeBehaviorSetListener {

	private static final long serialVersionUID = 1L;

	private Node mainNode;

	public BehaviorTreeWindow(String aiName, Node mainNode) {
		super("Behavior Tree - " + aiName);

		this.mainNode = mainNode;

		setSize(750, 750);
		setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
		setLocationRelativeTo(null);
		setAlwaysOnTop(true);
		// setLayout(null);
		constructTree();
		setVisible(true);

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Server.getInstance().getEventManager().addListener(NodeBehaviorSetListener.class, this);

		BehaviorTreeWindow thisObj = this;

		this.addWindowListener(new WindowAdapter() {
			public void windowClosing(WindowEvent e) {
				Server.getInstance().getEventManager().clearListenersFromObject(thisObj);
			}
		});
	}

	@Override
	public void onNodeBehaviorSet(Node node, BehaviorStatus behavior) {
		if (!mainNode.hasChild(node))
			return;
	}

	@Override
	public void onNextTurn() {

	}

	private void constructTree() {
		addLeaf("LowHealthNode", 100, 100);
	}

	private void addLeaf(String text, int x, int y) {
		getContentPane().add(new TreeRect(text, x, y));
	}
}
