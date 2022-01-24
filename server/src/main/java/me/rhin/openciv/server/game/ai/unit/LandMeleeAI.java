package me.rhin.openciv.server.game.ai.unit;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.behavior.ErrorNode;
import me.rhin.openciv.server.game.ai.behavior.FallbackNode;
import me.rhin.openciv.server.game.ai.behavior.SequenceNode;
import me.rhin.openciv.server.game.ai.behavior.nodes.AdjToEnemyNode;
import me.rhin.openciv.server.game.ai.behavior.nodes.ApproachEnemyNode;
import me.rhin.openciv.server.game.ai.behavior.nodes.AtWarNode;
import me.rhin.openciv.server.game.ai.behavior.nodes.MeleeAttackNode;
import me.rhin.openciv.server.game.ai.behavior.nodes.NearEnemyNode;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.NextTurnListener;

public class LandMeleeAI implements UnitAI, NextTurnListener {

	private FallbackNode mainNode;
	private Unit unit;

	public LandMeleeAI(Unit unit) {
		this.unit = unit;

		mainNode = new FallbackNode("Main Node");
		
		SequenceNode healthLowSequenceNode = new SequenceNode("HealthLowSequenceNode");
		
		FallbackNode adjEnemyFallbackNode = new FallbackNode("AdjEnemyFallbackNode");
		adjEnemyFallbackNode.addChild(healthLowSequenceNode);
		healthLowSequenceNode.addChild(new ApproachEnemyNode(unit));
		
		SequenceNode adjEnemySequenceNode = new SequenceNode("NearEnemySequenceNode");
		adjEnemySequenceNode.addChild(new AdjToEnemyNode(unit));
		adjEnemySequenceNode.addChild(new MeleeAttackNode(unit));

		FallbackNode nearEnemyFallbackNode = new FallbackNode("NearEnemyFallbackNode");
		nearEnemyFallbackNode.addChild(adjEnemySequenceNode);
		nearEnemyFallbackNode.addChild(adjEnemyFallbackNode);

		NearEnemyNode nearEnemyNode = new NearEnemyNode(unit);
		nearEnemyNode.addChild(nearEnemyFallbackNode);

		FallbackNode atWarFallbackNode = new FallbackNode("AtWarFallbackNode");
		atWarFallbackNode.addChild(nearEnemyNode);

		AtWarNode atWarNode = new AtWarNode(unit);
		atWarNode.addChild(atWarFallbackNode);

		mainNode.addChild(atWarNode);
		mainNode.addChild(new ErrorNode());

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {
		mainNode.tick();
	}

	@Override
	public void clearListeners() {
		Server.getInstance().getEventManager().clearListenersFromObject(this);
	}

}
