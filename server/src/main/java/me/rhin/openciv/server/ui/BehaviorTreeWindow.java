package me.rhin.openciv.server.ui;

import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

import javax.swing.JFrame;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;

public class BehaviorTreeWindow extends JFrame implements Listener {

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

		Server.getInstance().getEventManager().addListener(this);

		BehaviorTreeWindow thisObj = this;

		this.addWindowListener(new WindowAdapter() {
			public void windowClosing(WindowEvent e) {
				Server.getInstance().getEventManager().removeListener(thisObj);
			}
		});
	}

	@EventHandler
	public void onNodeBehaviorSet(Node node, BehaviorStatus behavior) {
		if (!mainNode.hasChild(node))
			return;
	}

	@EventHandler
	public void onNextTurn() {

	}

	private void constructTree() {
		addLeaf(mainNode.getName(), 100, 100);
	}

	private void addLeaf(String text, int x, int y) {
		getContentPane().add(new TreeRect(text, x, y));
	}
}
