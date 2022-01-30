package me.rhin.openciv.server.game.ai.unit;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.Constructor;

import org.json.JSONArray;
import org.json.JSONObject;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.behavior.FallbackNode;
import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.server.game.ai.behavior.SequenceNode;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.NextTurnListener;

public class LandMeleeAI implements UnitAI, NextTurnListener {

	private FallbackNode mainNode;
	private Unit unit;

	public LandMeleeAI(Unit unit) {
		this.unit = unit;

		String text = "";
		BufferedReader reader;

		try {
			reader = new BufferedReader(new FileReader("data/ai/land_melee_unit.json"));
			String line = reader.readLine();
			while (line != null) {
				text += line + "\n";
				line = reader.readLine();
			}
			reader.close();
		} catch (IOException e) {
			e.printStackTrace();
		}

		System.out.println(text);
		System.out.println("--------------");

		JSONObject jsonObj = new JSONObject(text);

		mainNode = new FallbackNode("Main Node");

		addNode(mainNode, jsonObj);

		/*
		 * SequenceNode healthLowSequenceNode = new
		 * SequenceNode("HealthLowSequenceNode");
		 * 
		 * FallbackNode adjEnemyFallbackNode = new FallbackNode("AdjEnemyFallbackNode");
		 * adjEnemyFallbackNode.addChild(healthLowSequenceNode);
		 * healthLowSequenceNode.addChild(new ApproachEnemyNode(unit));
		 * 
		 * SequenceNode adjEnemySequenceNode = new
		 * SequenceNode("NearEnemySequenceNode"); adjEnemySequenceNode.addChild(new
		 * AdjToEnemyNode(unit)); adjEnemySequenceNode.addChild(new
		 * MeleeAttackNode(unit));
		 * 
		 * FallbackNode nearEnemyFallbackNode = new
		 * FallbackNode("NearEnemyFallbackNode");
		 * nearEnemyFallbackNode.addChild(adjEnemySequenceNode);
		 * nearEnemyFallbackNode.addChild(adjEnemyFallbackNode);
		 * 
		 * NearEnemyNode nearEnemyNode = new NearEnemyNode(unit);
		 * nearEnemyNode.addChild(nearEnemyFallbackNode);
		 * 
		 * FallbackNode atWarFallbackNode = new FallbackNode("AtWarFallbackNode");
		 * atWarFallbackNode.addChild(nearEnemyNode);
		 * 
		 * AtWarNode atWarNode = new AtWarNode(unit);
		 * atWarNode.addChild(atWarFallbackNode);
		 * 
		 * mainNode.addChild(atWarNode); mainNode.addChild(new ErrorNode());
		 */

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	private void addNode(Node parentNode, JSONObject jsonObj) {

		String nodeType = jsonObj.getString("nodeType");

		Node childNode = getNodeByName(nodeType);

		System.out.println("Adding Node: " + childNode.getName() + " to parent:" + parentNode.getName());

		parentNode.addChild(childNode);

		if (jsonObj.has("children")) {

			JSONArray jsonArray = jsonObj.getJSONArray("children");

			for (int i = 0; i < jsonArray.length(); i++) {
				addNode(childNode, jsonArray.getJSONObject(i));
			}
		}
	}

	private Node getNodeByName(String nodeType) {
		Node node = null;

		// Returns instantiated node in the behavior tree.
		Node initializedNode = getInitializedNodeByName(nodeType);

		if (initializedNode != null)
			return initializedNode;

		switch (nodeType) {
		case "FallbackNode":
			node = new FallbackNode(nodeType);
			break;
		case "SequenceNode":
			node = new SequenceNode(nodeType);
			break;
		default:

			try {
				Class<?> nodeClass = Class.forName("me.rhin.openciv.server.game.ai.behavior.nodes." + nodeType);
				Constructor<?> unitConstructor = nodeClass.getConstructor(Unit.class, String.class);
				node = (UnitNode) unitConstructor.newInstance(unit, nodeType);
			} catch (Exception e) {
				e.printStackTrace();
			}

			break;
		}

		return node;
	}

	private Node getInitializedNodeByName(String nodeType) {

		return null;
	}

	@Override
	public void onNextTurn() {
		System.out.println("Hi");
		mainNode.tick();
	}

	@Override
	public void clearListeners() {
		Server.getInstance().getEventManager().clearListenersFromObject(this);
	}

}
