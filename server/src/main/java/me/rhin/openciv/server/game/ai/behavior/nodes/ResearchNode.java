package me.rhin.openciv.server.game.ai.behavior.nodes;

import java.util.ArrayList;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.PlayerNode;
import me.rhin.openciv.server.game.research.Technology;

public class ResearchNode extends PlayerNode {

	public ResearchNode(AbstractPlayer player, String name) {
		super(player, name);
	}

	@Override
	public void tick() {
		ArrayList<Technology> availableTechs = new ArrayList<>();
		for (Technology tech : player.getResearchTree().getTechnologies()) {
			if (tech.canResearch())
				availableTechs.add(tech);
		}

		// Choose top tech based on order of ResearchProperties.
		float techValue = 0;
		Technology topTech = null;
		for (Technology tech : availableTechs) {
			float currentValue = tech.getTechValue();
			if (techValue < currentValue) {
				techValue = currentValue;
				topTech = tech;
			}
		}

		if (topTech == null) {
			// System.out.println("FIXME: No techs with properties.");
			setStatus(BehaviorStatus.FAILURE);
			return;
		}

		System.out.println("Tech Choose:" + topTech.getName());
		player.getResearchTree().chooseTech(topTech);

		setStatus(BehaviorStatus.SUCCESS);
	}

}
