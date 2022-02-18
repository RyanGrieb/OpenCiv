package me.rhin.openciv.server.ui;

import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

import javax.swing.JFrame;
import javax.swing.JOptionPane;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.server.listener.NextTurnListener;

public class BehaviorTreeWindow extends JFrame implements NextTurnListener {

	private static final long serialVersionUID = 1L;

	private Node mainNode;

	public BehaviorTreeWindow(String aiName, Node mainNode) {
		super("Behavior Tree - " + aiName);

		this.mainNode = mainNode;

		setSize(750, 750);
		setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
		setVisible(true);
		setLocationRelativeTo(null);
		setAlwaysOnTop(true);

		constructTree();

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);

		BehaviorTreeWindow thisObj = this;

		this.addWindowListener(new WindowAdapter() {
			public void windowClosing(WindowEvent e) {
				Server.getInstance().getEventManager().clearListenersFromObject(thisObj);
			}
		});
	}

	@Override
	public void onNextTurn() {

	}

	private void constructTree() {
		
	}
}
