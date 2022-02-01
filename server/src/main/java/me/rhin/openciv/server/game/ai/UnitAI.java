package me.rhin.openciv.server.game.ai;

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

public class UnitAI implements NextTurnListener {

	protected FallbackNode mainNode;
	protected Unit unit;

	public UnitAI(Unit unit, AIType aiType) {
		this.unit = unit;

		mainNode = new FallbackNode("Main Node");
		aiType.initBehaviorTree(mainNode, unit);

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {
		mainNode.tick();
	}

	public void clearListeners() {
		Server.getInstance().getEventManager().clearListenersFromObject(this);
	}
}
