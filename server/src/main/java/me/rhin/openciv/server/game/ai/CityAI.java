package me.rhin.openciv.server.game.ai;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.behavior.FallbackNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;

public class CityAI implements Listener {

	private FallbackNode mainNode;
	private City city;

	public CityAI(City city, AIType aiType) {
		this.city = city;

		mainNode = new FallbackNode("Main Node");
		aiType.initBehaviorTree(mainNode, city);

		mainNode.tick();

		Server.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onNextTurn() {
		mainNode.tick();
	}

}
