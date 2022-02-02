package me.rhin.openciv.server.game.ai;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.Constructor;

import org.json.JSONArray;
import org.json.JSONObject;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.FallbackNode;
import me.rhin.openciv.server.game.ai.behavior.InverseNode;
import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.server.game.ai.behavior.SequenceNode;
import me.rhin.openciv.server.game.ai.behavior.SmoothNode;
import me.rhin.openciv.server.game.ai.behavior.nodes.DoNothingNode;
import me.rhin.openciv.server.game.ai.behavior.nodes.StartOfGameNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.unit.Unit;

public enum AIType {
	BARBARIAN_MELEE_UNIT("data/ai/barbarian_melee_unit.json", Unit.class),
	LAND_MELEE_UNIT("data/ai/land_melee_unit.json", Unit.class),
	SETTLER_UNIT("data/ai/settler_unit.json", Unit.class),
	BARBARIAN_PLAYER("data/ai/barbarian_player.json", AbstractPlayer.class),
	PLAYER("data/ai/player.json", AbstractPlayer.class),
	CITY("data/ai/city.json", City.class);

	private String aiJSONPath;
	private Class<?> nodeParameter;

	AIType(String aiJSONPath, Class<?> nodeParameter) {
		this.aiJSONPath = aiJSONPath;
		this.nodeParameter = nodeParameter;
	}

	public void initBehaviorTree(FallbackNode mainNode, Object nodeParamObj) {
		String text = "";
		BufferedReader reader;

		try {
			reader = new BufferedReader(new FileReader(aiJSONPath));
			String line = reader.readLine();
			while (line != null) {
				text += line + "\n";
				line = reader.readLine();
			}
			reader.close();
		} catch (IOException e) {
			e.printStackTrace();
		}

		JSONObject jsonObj = new JSONObject(text);
		addNode(mainNode, nodeParamObj, jsonObj);
	}

	private void addNode(Node parentNode, Object nodeParamObj, JSONObject jsonObj) {

		String nodeType = jsonObj.getString("nodeType");

		Node childNode = getNodeByName(nodeType, nodeParamObj);

		parentNode.addChild(childNode);

		if (jsonObj.has("children")) {

			JSONArray jsonArray = jsonObj.getJSONArray("children");

			for (int i = 0; i < jsonArray.length(); i++) {
				addNode(childNode, nodeParamObj, jsonArray.getJSONObject(i));
			}
		}
	}

	private Node getNodeByName(String nodeType, Object nodeParamObject) {
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
		case "SmoothNode":
			node = new SmoothNode(nodeType);
			break;
		case "InverseNode":
			node = new InverseNode(nodeType);
			break;
		case "StartOfGameNode":
			node = new StartOfGameNode(nodeType);
			break;
		case "DoNothingNode":
			node = new DoNothingNode(nodeType);
			break;
		default:

			try {
				Class<?> nodeClass = Class.forName("me.rhin.openciv.server.game.ai.behavior.nodes." + nodeType);
				Constructor<?> unitConstructor = nodeClass.getConstructor(nodeParameter, String.class);
				node = (Node) unitConstructor.newInstance(nodeParamObject, nodeType);
			} catch (Exception e) {
				e.printStackTrace();
			}

			break;
		}

		return node;
	}

	private Node getInitializedNodeByName(String nodeType) {
		// FIXME: Do we need this?
		return null;
	}
}
